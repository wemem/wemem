package service

import (
	"context"
	"encoding/json"
	"github.com/dghubble/sling"
	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"
	"github.com/samber/lo"
	rdb "readflow.ai/goserver/db/rdb"
	"readflow.ai/goserver/utils"
	"strings"
	"time"
)

type turndownResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    string `json:"data"`
}

type FeedService struct {
	rdb        *rdb.PrismaClient
	feedParser *gofeed.Parser
}

func NewFeedService(rdb *rdb.PrismaClient, feedParser *gofeed.Parser) *FeedService {
	return &FeedService{rdb: rdb, feedParser: feedParser}
}

func (s FeedService) SearchFeeds(ctx context.Context, keyword string) ([]rdb.FeedModel, error) {
	var res []rdb.FeedModel
	if len(strings.TrimSpace(keyword)) == 0 {
		return res, nil
	}

	if strings.HasPrefix(keyword, "http") || strings.HasPrefix(keyword, "https") {
		dbFeed, err := s.searchFeedLink(ctx, keyword)
		if err != nil {
			return nil, err
		}
		res = append(res, *dbFeed)
		return res, nil
	}

	return s.searchKeyword(ctx, keyword)
}

func (s FeedService) searchKeyword(ctx context.Context, keyword string) ([]rdb.FeedModel, error) {
	// Check if a Feed with the same FeedLink already exists
	feeds, err := s.rdb.Feed.FindMany(
		rdb.Feed.Title.Contains(keyword),
	).Exec(ctx)

	if err != nil {
		return nil, errors.WithStack(err)
	}
	return feeds, nil
}

func (s FeedService) searchFeedLink(ctx context.Context, feedLink string) (*rdb.FeedModel, error) {
	// Check if a Feed with the same FeedLink already exists
	dbFeed, err := s.rdb.Feed.FindFirst(
		rdb.Feed.FeedLink.Equals(feedLink),
	).Exec(ctx)

	if err != nil {
		if !rdb.IsErrNotFound(err) {
			return nil, errors.WithStack(err)
		}
		dbFeed, err = s.createNewFeed(ctx, feedLink)
		if err != nil {
			return nil, err
		}
	}
	return dbFeed, nil
}

func (s FeedService) createNewFeed(ctx context.Context, feedLink string) (*rdb.FeedModel, error) {
	netFeed, err := s.feedParser.ParseURLWithContext(feedLink, ctx)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	extensions, err := json.Marshal(netFeed.Extensions)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	custom, err := json.Marshal(netFeed.Custom)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	image, err := json.Marshal(netFeed.Image)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	dublinCoreExt, err := json.Marshal(netFeed.DublinCoreExt)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	itunesExt, err := json.Marshal(netFeed.ITunesExt)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	var txs []rdb.PrismaTransaction
	feedId := utils.UUID()

	txFeed := s.rdb.Feed.CreateOne(
		rdb.Feed.Title.Set(netFeed.Title),
		rdb.Feed.Description.Set(netFeed.Description),
		rdb.Feed.Link.Set(netFeed.Link),
		rdb.Feed.FeedLink.Set(feedLink),
		rdb.Feed.Extensions.Set(extensions),
		rdb.Feed.Custom.Set(custom),
		rdb.Feed.FeedType.Set(netFeed.FeedType),
		rdb.Feed.FeedVersion.Set(netFeed.FeedVersion),
		rdb.Feed.Links.Set(netFeed.Links),
		rdb.Feed.Language.Set(netFeed.Language),
		rdb.Feed.Image.Set(image),
		rdb.Feed.Copyright.Set(netFeed.Copyright),
		rdb.Feed.Categories.Set(netFeed.Categories),
		rdb.Feed.Generator.Set(netFeed.Generator),
		rdb.Feed.DublinCoreExt.Set(dublinCoreExt),
		rdb.Feed.ITunesExt.Set(itunesExt),
		rdb.Feed.ID.Set(feedId),
		rdb.Feed.Updated.SetIfPresent(netFeed.UpdatedParsed),
		rdb.Feed.Published.SetIfPresent(netFeed.PublishedParsed),
	).Tx()

	persons := lo.UniqBy(netFeed.Authors, func(item *gofeed.Person) string {
		return item.Name + "|" + item.Email
	})

	var dbPersons []*rdb.FeedPersonModel
	for _, person := range persons {
		dbPerson, err := s.upsertPerson(ctx, feedId, person)
		if err != nil {
			return nil, err
		}
		dbPersons = append(dbPersons, dbPerson)
	}

	dbPersonsMap := lo.KeyBy(dbPersons, func(item *rdb.FeedPersonModel) string {
		return item.Name + "|" + item.Email
	})

	txs = append(txs, txFeed)
	for _, author := range netFeed.Authors {
		personId := dbPersonsMap[author.Name+"|"+author.Email].ID
		txs = append(txs, s.rdb.FeedsAuthors.CreateOne(
			rdb.FeedsAuthors.Feed.Link(rdb.Feed.ID.Equals(feedId)),
			rdb.FeedsAuthors.Person.Link(rdb.FeedPerson.ID.Equals(personId)),
		).Tx())
	}
	if err := s.rdb.Prisma.Transaction(txs...).Exec(ctx); err != nil {
		return nil, errors.WithStack(err)
	}

	return txFeed.Result(), nil
}

func (s FeedService) upsertPerson(ctx context.Context, feedId string, person *gofeed.Person) (*rdb.FeedPersonModel, error) {
	dbPerson, err := s.rdb.FeedPerson.FindFirst(
		rdb.FeedPerson.FeedID.Set(feedId),
		rdb.FeedPerson.Name.Equals(person.Name),
		rdb.FeedPerson.Email.Equals(person.Email),
	).Exec(ctx)
	if err != nil {
		if !rdb.IsErrNotFound(err) {
			return nil, errors.WithStack(err)
		}
		dbPerson, err = s.rdb.FeedPerson.CreateOne(
			rdb.FeedPerson.FeedID.Set(feedId),
			rdb.FeedPerson.Name.Set(person.Name),
			rdb.FeedPerson.Email.Set(person.Email),
		).Exec(ctx)

		return dbPerson, errors.WithStack(err)
	}

	return dbPerson, nil
}

func (s FeedService) FetchFeed(ctx context.Context) error {
	dbFeeds, err := s.rdb.Feed.FindMany().Exec(ctx)
	if err != nil {
		return errors.WithStack(err)
	}

	for _, dbFeed := range dbFeeds {
		tctx, cancel := context.WithTimeout(ctx, 10*time.Second)
		netFeed, err := s.feedParser.ParseURLWithContext(dbFeed.FeedLink, tctx)
		if err != nil {
			cancel()
			return errors.WithStack(err)
		}

		for _, item := range netFeed.Items {
			htmlDescription := strings.NewReader(item.Description)
			mdDescription := new(turndownResponse)
			if len(item.Description) > 0 {
				if _, err = sling.New().Base("http://localhost:5010").Set("Content-Type", "text/html").Post("convert").Body(htmlDescription).ReceiveSuccess(mdDescription); err != nil {
					cancel()
					return errors.WithStack(err)
				}
			}

			htmlContent := strings.NewReader(item.Content)
			mdContent := new(turndownResponse)
			if len(item.Content) > 0 {
				if _, err = sling.New().Base("http://localhost:5010").Set("Content-Type", "text/html").Post("convert").Body(htmlContent).ReceiveSuccess(mdContent); err != nil {
					cancel()
					return errors.WithStack(err)
				}
			}
			s.rdb.FeedItem.CreateOne(
				rdb.FeedItem.Title.Set(item.Title),
				rdb.FeedItem.Description.Set(item.Description),
				rdb.FeedItem.Feed.Link(rdb.Feed.ID.Equals(dbFeed.ID)),
				rdb.FeedItem.DescriptionMarkdown.Set(mdDescription.Data),
				rdb.FeedItem.Content.Set(item.Content),
				rdb.FeedItem.ContentMarkdown.Set(mdContent.Data),
			)
		}
	}

	return nil
}

func (s FeedService) RefreshFeed(ctx context.Context, feedId string) error {
	tctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	dbFeed, err := s.rdb.Feed.FindFirst(rdb.Feed.ID.Equals(feedId)).Exec(ctx)
	if err != nil {
		return errors.WithStack(err)
	}
	netFeed, err := s.feedParser.ParseURLWithContext(dbFeed.FeedLink, tctx)
	if err != nil {
		return errors.WithStack(err)
	}

	persons := lo.FlatMap(netFeed.Items, func(item *gofeed.Item, idx int) []*gofeed.Person {
		return item.Authors
	})
	persons = lo.UniqBy(persons, func(item *gofeed.Person) string {
		return item.Name + "|" + item.Email
	})

	var dbPersons []*rdb.FeedPersonModel
	for _, person := range persons {
		dbPerson, err := s.upsertPerson(ctx, feedId, person)
		if err != nil {
			return err
		}
		dbPersons = append(dbPersons, dbPerson)
	}

	dbPersonsMap := lo.KeyBy(dbPersons, func(item *rdb.FeedPersonModel) string {
		return item.Name + "|" + item.Email
	})

	var txs []rdb.PrismaTransaction
	for _, item := range netFeed.Items {
		_, err = s.rdb.FeedItem.FindFirst(
			rdb.FeedItem.GUID.Equals(item.GUID),
			rdb.FeedItem.FeedID.Equals(feedId)).Exec(ctx)

		// 数据库中已经存在，跳过
		if err == nil {
			continue
		}

		if !rdb.IsErrNotFound(err) {
			return errors.WithStack(err)
		}

		htmlDescription := strings.NewReader(item.Description)
		mdDescription := new(turndownResponse)
		if len(item.Description) > 0 {
			if _, err = sling.New().
				Base("http://localhost:5010").
				Set("Content-Type", "text/html").
				Post("convert").
				Body(htmlDescription).
				ReceiveSuccess(mdDescription); err != nil {
				cancel()
				return errors.WithStack(err)
			}
		}

		htmlContent := strings.NewReader(item.Content)
		mdContent := new(turndownResponse)
		if len(item.Content) > 0 {
			if _, err = sling.New().
				Base("http://localhost:5010").
				Set("Content-Type", "text/html").
				Post("convert").
				Body(htmlContent).
				ReceiveSuccess(mdContent); err != nil {
				cancel()
				return errors.WithStack(err)
			}
		}
		image, err := json.Marshal(item.Image)
		if err != nil {
			return errors.WithStack(err)
		}

		enclosures, err := json.Marshal(item.Enclosures)
		if err != nil {
			return errors.WithStack(err)
		}

		dublinCoreExt, err := json.Marshal(item.DublinCoreExt)
		if err != nil {
			return errors.WithStack(err)
		}

		itunesExt, err := json.Marshal(item.ITunesExt)
		if err != nil {
			return errors.WithStack(err)
		}

		extensions, err := json.Marshal(item.Extensions)
		if err != nil {
			return errors.WithStack(err)
		}

		custom, err := json.Marshal(item.Custom)
		if err != nil {
			return errors.WithStack(err)
		}

		itemId := utils.UUID()

		txs = append(txs, s.rdb.FeedItem.CreateOne(
			rdb.FeedItem.Title.Set(item.Title),
			rdb.FeedItem.Description.Set(item.Title),
			rdb.FeedItem.Feed.Link(rdb.Feed.ID.Equals(dbFeed.ID)),
			rdb.FeedItem.DescriptionMarkdown.Set(mdDescription.Data),
			rdb.FeedItem.Content.Set(item.Content),
			rdb.FeedItem.ContentMarkdown.Set(mdContent.Data),
			rdb.FeedItem.Link.Set(item.Link),
			rdb.FeedItem.Links.Set(item.Links),
			rdb.FeedItem.Updated.SetIfPresent(item.UpdatedParsed),
			rdb.FeedItem.Published.SetIfPresent(item.PublishedParsed),
			rdb.FeedItem.GUID.Set(item.GUID),
			rdb.FeedItem.Image.Set(image),
			rdb.FeedItem.Categories.Set(item.Categories),
			rdb.FeedItem.Enclosures.Set(enclosures),
			rdb.FeedItem.DublinCoreExt.Set(dublinCoreExt),
			rdb.FeedItem.ItunesExt.Set(itunesExt),
			rdb.FeedItem.Extensions.Set(extensions),
			rdb.FeedItem.Custom.Set(custom),
			rdb.FeedItem.ID.Set(itemId),
		).Tx())

		for _, author := range item.Authors {
			personId := dbPersonsMap[author.Name+"|"+author.Email].ID
			txs = append(txs, s.rdb.FeedItemsAuthors.CreateOne(
				rdb.FeedItemsAuthors.FeedItem.Link(rdb.FeedItem.ID.Equals(itemId)),
				rdb.FeedItemsAuthors.Person.Link(rdb.FeedPerson.ID.Equals(personId)),
			).Tx())
		}
	}

	if err := s.rdb.Prisma.Transaction(txs...).Exec(ctx); err != nil {
		return errors.WithStack(err)
	}

	return nil
}

func (s FeedService) PullFeed(ctx context.Context, feedId string, latestFeedItemID *string, latestCreatedAt *string) ([]rdb.FeedItemModel, error) {
	items, err := s.rdb.FeedItem.FindMany(
		rdb.FeedItem.FeedID.Equals(feedId),
		rdb.FeedItem.ID.GtIfPresent(latestFeedItemID),
	).OrderBy(rdb.FeedItem.ID.Order(rdb.SortOrderDesc)).
		Take(10).
		Exec(ctx)

	return items, errors.WithStack(err)
}
