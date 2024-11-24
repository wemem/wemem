import crypto, { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import {
  DirectionalityType,
  FeedFetchContentType,
  FeedPageState,
  FeedPageType,
  PrismaClient,
} from '@prisma/client';
import axios, { AxiosError } from 'axios';
import { parseHTML } from 'linkedom';
import Parser, { Item } from 'rss-parser';

import { TracedLogger } from '../../../fundamentals';
import { Cache } from '../../../fundamentals/cache';
import { Config } from '../../../fundamentals/config';
import { FeedContentService } from '../service/feed-content';
import { cleanUrl, validatedDate, wordsCount } from '../utils/helpers';
import { validateUrl } from '../utils/validate';

@Injectable()
export class RefreshFeedService {
  constructor(
    private readonly cache: Cache,
    private readonly prisma: PrismaClient,
    private readonly feedContentService: FeedContentService,
    private readonly config: Config
  ) {}

  async handle(refreshFeedJobData: RefreshFeedJobData) {
    const {
      feedUrl,
      userIds,
      userFeedIds,
      workspaceIds,
      fetchContentTypes,
      mostRecentItemDates,
      scheduledTimestamps,
      lastFetchedChecksums,
    } = refreshFeedJobData;

    if (await this.isFeedBlocked(feedUrl)) {
      logger.log(`feed is blocked: ${feedUrl}`);
      throw new Error('feed is blocked');
    }

    const fetchResult = await fetchAndChecksum(feedUrl);
    if (!fetchResult) {
      logger.error(`Failed to fetch RSS feed ${feedUrl}`);
      await this.incrementFeedFailure(feedUrl);
      throw new Error('Failed to fetch RSS feed');
    }

    const feed = await parseFeed(feedUrl, fetchResult.content);
    if (!feed) {
      logger.error(`Failed to parse RSS feed ${feedUrl}`);
      await this.incrementFeedFailure(feedUrl);
      throw new Error('Failed to parse RSS feed');
    }

    let allowFetchContent = true;
    if (isContentFetchBlocked(feedUrl)) {
      logger.log(`fetching content blocked for feed: ${feedUrl}`);
      allowFetchContent = false;
    }

    logger.log('Fetched feed', { title: feed.title, at: new Date() });

    const fetchContentTasks: FetchContentTasks = new Map(); // url -> FetchContentTask

    for (let i = 0; i < userFeedIds.length; i++) {
      const userFeedId = userFeedIds[i];
      const fetchContentType = allowFetchContent
        ? fetchContentTypes[i]
        : FeedFetchContentType.NEVER;

      try {
        await this.processUserSource(
          fetchContentTasks,
          userFeedId,
          userIds[i],
          workspaceIds[i],
          feedUrl,
          fetchResult,
          mostRecentItemDates[i],
          scheduledTimestamps[i],
          lastFetchedChecksums[i],
          fetchContentType,
          feed
        );
      } catch (error: Error | unknown) {
        logger.error('Error while processing subscription', {
          error: error instanceof Error ? error.message : 'unknown error',
          stack: error instanceof Error ? error.stack : 'unknown stack',
          userSourceId: userFeedId,
        });
      }
    }

    // create fetch content tasks
    for (const task of fetchContentTasks.values()) {
      const result = await this.fetchContentAndCreateItem(
        Array.from(task.users.values()),
        feedUrl,
        task.item
      );

      task.result = result;
    }
  }

  private async isFeedBlocked(feedUrl: string) {
    const key = feedFetchFailedRedisKey(feedUrl);
    try {
      const result = await this.cache.get<string>(key);
      // if the feed has failed to fetch more than certain times, block it
      const maxFailures = parseInt(process.env.MAX_FEED_FETCH_FAILURES ?? '10');
      if (result && parseInt(result) > maxFailures) {
        return true;
      }
    } catch (error) {
      logger.error('Failed to check feed block status', { feedUrl, error });
    }

    return false;
  }

  private async incrementFeedFailure(feedUrl: string) {
    const key = feedFetchFailedRedisKey(feedUrl);
    try {
      const result = await this.cache.increase(key);
      // expire the key in 1 day
      await this.cache.expire(key, 24 * 60 * 60);

      return result;
    } catch (error) {
      logger.error('Failed to block feed', { feedUrl, error });
      return null;
    }
  }

  private async isItemRecentlySaved(userId: string, url: string) {
    const key = recentSavedItemRedisKey(userId, url);
    try {
      const result = await this.cache.get(key);
      return !!result;
    } catch (err) {
      logger.error('error checking if item is old', err);
    }
    // If we failed to check, assume the item is good
    return false;
  }

  private async processUserSource(
    fetchContentTasks: FetchContentTasks,
    userFeedId: string,
    userId: string,
    workspaceId: string,
    feedUrl: string,
    fetchResult: { content: string; checksum: string },
    mostRecentItemDate: number,
    scheduledAt: number,
    lastFetchedChecksum: string | null,
    fetchContentType: FeedFetchContentType,
    feed: RssFeed
  ) {
    const refreshedAt = new Date();

    let lastItemFetchedAt: Date | null = null;
    let lastValidItem: RssFeedItem | null = null;

    if (fetchResult.checksum === lastFetchedChecksum) {
      logger.log('feed has not been updated', { feedUrl, lastFetchedChecksum });
      return;
    }
    const updatedLastFetchedChecksum = fetchResult.checksum;

    // fetch feed
    let itemCount = 0,
      failedAt: Date | null = null;

    const feedLastBuildDate = feed.lastBuildDate;
    logger.log(`Feed last build date ${feedLastBuildDate || 'N/A'}`);
    if (
      feedLastBuildDate &&
      new Date(feedLastBuildDate) <= new Date(mostRecentItemDate)
    ) {
      logger.log(`Skipping old feed ${feedLastBuildDate}`);
      return;
    }

    // save each item in the feed
    for (const item of feed.items) {
      try {
        const guid = item.guid || item.link;
        // use published or updated if isoDate is not available for atom feeds
        const isoDate =
          item.isoDate || item.published || item.updated || item.created;

        logger.log('Processing feed item', {
          guid,
          links: item.links,
          isoDate,
          feedUrl,
        });

        if (!item.links || item.links.length === 0 || !guid) {
          throw new Error('Invalid feed item');
        }

        // fallback to guid if link is not available
        const link = getLink(item.links, feedUrl) || guid;
        if (!link) {
          throw new Error('Invalid feed item link');
        }

        const creator = item.creator || (item.author && getAuthor(item.author));

        const feedItem = {
          ...item,
          isoDate,
          link,
          creator,
        };

        const publishedAt = feedItem.isoDate
          ? new Date(feedItem.isoDate)
          : new Date();
        // remember the last valid item
        if (
          !lastValidItem ||
          (lastValidItem.isoDate &&
            publishedAt > new Date(lastValidItem.isoDate))
        ) {
          lastValidItem = feedItem;
        }

        // Max limit per-feed update
        if (itemCount > 99) {
          if (itemCount === 100) {
            logger.log(`Max limit reached for feed ${feedUrl}`);
          }
          itemCount = itemCount + 1;
          continue;
        }

        // skip old items
        if (isOldItem(feedItem, mostRecentItemDate)) {
          logger.log(`Skipping old feed item ${feedItem.link}`);
          continue;
        }

        const created = await this.createTask(
          fetchContentTasks,
          userId,
          workspaceId,
          feedUrl,
          feedItem,
          fetchContentType
        );
        if (!created) {
          throw new Error('Failed to create task for feed item');
        }

        // remember the last item fetched at
        if (!lastItemFetchedAt || publishedAt > lastItemFetchedAt) {
          lastItemFetchedAt = publishedAt;
        }

        itemCount = itemCount + 1;
      } catch (error) {
        logger.error('Error while saving RSS feed item', { error, item });
        failedAt = new Date();
      }
    }

    // no items saved
    if (!lastItemFetchedAt && !failedAt) {
      // the feed has been fetched before, no new valid items found
      if (mostRecentItemDate || !lastValidItem) {
        logger.log('No new valid items found');
        return;
      }

      // the feed has never been fetched, save at least the last valid item
      const created = await this.createTask(
        fetchContentTasks,
        userId,
        workspaceId,
        feedUrl,
        lastValidItem,
        fetchContentType
      );
      if (!created) {
        logger.error('Failed to create task for feed item', {
          url: lastValidItem.link,
        });
        failedAt = new Date();
      }

      lastItemFetchedAt = lastValidItem.isoDate
        ? new Date(lastValidItem.isoDate)
        : refreshedAt;
    }

    const updateFrequency = getUpdateFrequency(feed);
    const updatePeriodInMs = getUpdatePeriodInHours(feed) * 60 * 60 * 1000;
    const nextScheduledAt = scheduledAt + updatePeriodInMs * updateFrequency;

    const updatedUserSource = await this.prisma.userFeed.update({
      where: {
        id: userFeedId,
      },
      data: {
        mostRecentItemDate: lastItemFetchedAt,
        lastFetchedChecksum: updatedLastFetchedChecksum,
        scheduledAt: new Date(nextScheduledAt),
        refreshedAt,
        failedAt,
      },
    });
    logger.log('Updated user feed source', updatedUserSource);
  }

  private async createTask(
    fetchContentTasks: FetchContentTasks,
    userId: string,
    workspaceId: string,
    feedUrl: string,
    item: RssFeedItem,
    fetchContentType: FeedFetchContentType
  ) {
    const isRecentlySaved = await this.isItemRecentlySaved(userId, item.link);
    if (isRecentlySaved) {
      logger.log(`Item recently saved ${item.link}`);
      return true;
    }

    const feedContent = item.content || item.contentSnippet || item.summary;
    if (
      fetchContentType === FeedFetchContentType.NEVER ||
      (fetchContentType === FeedFetchContentType.WHEN_EMPTY && feedContent)
    ) {
      return this.createItemWithFeedContent(
        userId,
        workspaceId,
        feedUrl,
        item,
        feedContent
      );
    }

    logger.log(`adding fetch content task ${userId}  ${item.link.trim()}`);

    const url = item.link;
    const task = fetchContentTasks.get(url);
    const articleId = randomUUID();
    const userConfig: UserConfig = { userId, pageId: articleId, workspaceId };

    if (!task) {
      fetchContentTasks.set(url, {
        id: randomUUID(),
        users: new Map([[userId, userConfig]]),
        item,
      });
    } else {
      task.users.set(userId, userConfig);
    }

    return true;
  }

  private async createItemWithFeedContent(
    userId: string,
    workspaceId: string,
    feedUrl: string,
    item: RssFeedItem,
    feedContent?: string
  ) {
    try {
      logger.log('saving feed item with feed content', {
        userId,
        feedUrl,
        item,
      });

      const previewImage = getThumbnail(item);
      const url = cleanUrl(item.link);

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        logger.error('User not found', { userId });
        return false;
      }

      const checksum = await this.feedContentService.saveContent(feedContent);

      const page = await this.prisma.userFeedPage.create({
        data: {
          id: randomUUID(),
          userId,
          workspaceId,
          feedUrl,
          contentChecksum: checksum ?? '',
          state: FeedPageState.CONTENT_NOT_FETCHED,
          originalUrl: url,
          title: item.title || url,
          description: item.summary,
          author: item.creator,
          type: FeedPageType.ARTICLE,
          thumbnail: previewImage,
          publishedAt: item.isoDate ? validatedDate(item.isoDate) : undefined,
          savedAt: new Date(),
          wordCount: feedContent ? wordsCount(feedContent) : 0,
          directionality: DirectionalityType.LTR,
        },
      });
      logger.log('Created feed page', page);
      return true;
    } catch (error) {
      logger.error('Error while saving feed item with feed content', error);
      return false;
    }
  }

  private async fetchContentAndCreateItem(
    users: UserConfig[],
    feedUrl: string,
    item: RssFeedItem
  ) {
    const payload: FetchContentRequestBody = {
      users,
      taskId: '',
      source: 'rss-feeder',
      pageUrl: item.link.trim(),
      feedUrl: feedUrl,
      savedAt: item.isoDate,
      publishedAt: item.pubDate,
      priority: 'high',
      traceId: randomUUID(),
    };

    return await createHttpTaskWithToken({
      contentFetchUrl: this.config.plugins.feeds.contentFetchUrl,
      contentFetchToken: this.config.plugins.feeds.contentFetchToken,
      payload,
    });
  }
}

const createHttpTaskWithToken = async ({
  contentFetchUrl,
  contentFetchToken,
  payload,
  requestHeaders,
}: {
  contentFetchUrl: string;
  contentFetchToken: string;
  payload: unknown;
  requestHeaders?: Record<string, string>;
}) => {
  logger.log(
    'Sending content fetch task:' +
      JSON.stringify({
        contentFetchUrl,
        contentFetchToken,
        payload,
      })
  );

  try {
    const response = await axios.post(
      `${contentFetchUrl}?token=${contentFetchToken}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...requestHeaders,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return response.data as FetchContentResult;
  } catch (error) {
    logger.error(
      'Error while creating fetch content task',
      error,
      (error as Error).stack
    );
    return undefined;
  }
};

const logger = new TracedLogger(RefreshFeedService.name);

export interface RefreshFeedJobData {
  // Context information about this refresh job
  refreshContext: {
    // Type of refresh trigger - currently only supports user manually adding feeds
    type: 'user-added';
    // Unique ID for this refresh operation
    refreshID: string;
    // ISO timestamp when the refresh was initiated
    startedAt: string;
  };
  // IDs of UserFeed records to refresh
  userFeedIds: string[];
  // URL of the feed to fetch
  feedUrl: string;
  // Most recent item dates for each source, as unix timestamps in milliseconds
  mostRecentItemDates: number[]; // unix timestamp in milliseconds
  // Previous content checksums for detecting changes
  lastFetchedChecksums: (string | null)[];
  // When each source is scheduled to refresh, as unix timestamps
  scheduledTimestamps: number[]; // unix timestamp in milliseconds
  // IDs of users who own these feed sources
  userIds: string[];
  // IDs of workspaces who own these feed sources
  workspaceIds: string[];
  // Content fetch preferences for each source
  fetchContentTypes: FeedFetchContentType[];
}

export interface FetchContentRequestBody {
  pageUrl: string;
  traceId: string;
  state?: string;
  source?: string;
  taskId?: string;
  locale?: string;
  timezone?: string;
  feedUrl?: string;
  savedAt?: string;
  publishedAt?: string;
  users: UserConfig[];
  priority: 'high' | 'low';
}

// link can be a string or an object
// eslint-disable-next-line rxjs/finnish
export type RssFeedItemLink = string | { $: { rel?: string; href: string } };
export type RssFeedItemAuthor = string | { name: string };
export type RssFeed = Parser.Output<{
  published?: string;
  updated?: string;
  created?: string;
  link?: RssFeedItemLink;
  links?: RssFeedItemLink[];
  author?: RssFeedItemAuthor;
}> & {
  lastBuildDate?: string;
  'syn:updatePeriod'?: string;
  'syn:updateFrequency'?: string;
  'sy:updatePeriod'?: string;
  'sy:updateFrequency'?: string;
};
export type RssFeedItemMedia = {
  // eslint-disable-next-line rxjs/finnish
  $: { url: string; width?: string; height?: string; medium?: string };
};
export type RssFeedItem = Item & {
  'media:thumbnail'?: RssFeedItemMedia;
  'media:content'?: RssFeedItemMedia[];
  link: string;
};

interface UserConfig {
  userId: string;
  pageId: string;
  workspaceId: string;
}

type UserId = string;

interface FetchContentTask {
  id: string;
  users: Map<UserId, UserConfig>; // userId -> User
  item: RssFeedItem;
  result?: FetchContentResult;
}

interface FetchContentResult {
  finalPageUrl: string;
  title: string;
  contentType: string;
  contentFilePath: string;
  metadataFilePath: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['link', 'links', { keepArray: true }],
      'published',
      'updated',
      'created',
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail'],
      'author',
    ],
    feed: [
      'lastBuildDate',
      'syn:updatePeriod',
      'syn:updateFrequency',
      'sy:updatePeriod',
      'sy:updateFrequency',
    ],
  },
});

const feedFetchFailedRedisKey = (feedUrl: string) =>
  `feeds:fetch-failure:${feedUrl}`;

const recentSavedItemRedisKey = (userId: string, url: string) =>
  `feeds:recent-saved-item:${userId}:${url}`;

type ArticleUrl = string;

type FetchContentTasks = Map<ArticleUrl, FetchContentTask>; // url -> FetchContentTask

export const fetchAndChecksum = async (url: string) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60_000,
      maxRedirects: 10,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        Accept:
          'application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml, text/html;q=0.4',
      },
    });

    const hash = crypto.createHash('sha256');
    hash.update(response.data as Buffer);

    const dataStr = (response.data as Buffer).toString();

    return { url, content: dataStr, checksum: hash.digest('hex') };
  } catch (error) {
    logger.log(`Failed to fetch or hash content from ${url}.`, error);
    return null;
  }
};

const parseFeed = async (url: string, content: string) => {
  try {
    // check if url is a telegram channel or preview
    const telegramRegex = /t\.me\/([^/]+)/;
    const telegramMatch = url.match(telegramRegex);
    if (telegramMatch) {
      let channel = telegramMatch[1];
      if (channel.startsWith('s/')) {
        channel = channel.slice(2);
      } else {
        // open the preview page to get the data
        const fetchResult = await fetchAndChecksum(`https://t.me/s/${channel}`);
        if (!fetchResult) {
          return null;
        }

        content = fetchResult.content;
      }

      const dom = parseHTML(content).document;
      const title =
        dom
          .querySelector('meta[property="og:title"]')
          ?.getAttribute('content') || dom.title;
      // post has attribute data-post
      const posts = dom.querySelectorAll('[data-post]');
      const items = Array.from(posts)
        .map(post => {
          const id = (post as HTMLElement).dataset.post?.split('/')[1];
          if (!id) {
            return null;
          }

          const url = `https://t.me/s/${channel}/${id}`;
          const content = post.outerHTML;

          // find the <time> element
          const time = post.querySelector('time');
          const dateTime = time?.getAttribute('datetime') || undefined;

          return {
            link: url,
            isoDate: dateTime,
            title: `${title} - ${id}`,
            creator: title,
            content,
            links: [url],
          };
        })
        .filter(item => !!item) as RssFeedItem[];

      return {
        title,
        items,
      };
    }

    // return await is needed to catch errors thrown by the parser
    // otherwise the error will be caught by the outer try catch
    return await parser.parseString(content);
  } catch (error) {
    logger.log(`Failed to parse RSS feed ${url}.`, error);
    return null;
  }
};

const isContentFetchBlocked = (feedUrl: string) => {
  if (feedUrl.startsWith('https://arxiv.org/')) {
    return true;
  }
  if (feedUrl.startsWith('https://rss.arxiv.org')) {
    return true;
  }
  if (feedUrl.startsWith('https://rsshub.app')) {
    return true;
  }
  if (feedUrl.startsWith('https://xkcd.com')) {
    return true;
  }
  if (feedUrl.startsWith('https://daringfireball.net/feeds/')) {
    return true;
  }
  if (feedUrl.startsWith('https://lwn.net/headlines/newrss')) {
    return true;
  }
  if (feedUrl.startsWith('https://medium.com')) {
    return true;
  }
  return false;
};

const getLink = (
  links: RssFeedItemLink[],
  feedUrl: string
): string | undefined => {
  // sort links by preference
  const sortedLinks: string[] = [];

  links.forEach(link => {
    // if link is a string, it is the href
    if (typeof link === 'string') {
      return sortedLinks.push(link);
    }

    if (link.$.rel === 'via') {
      sortedLinks[0] = link.$.href;
    }
    if (link.$.rel === 'alternate') {
      sortedLinks[1] = link.$.href;
    }
    if (link.$.rel === 'self' || !link.$.rel) {
      sortedLinks[2] = link.$.href;
    }
  });

  // return the first link that is not undefined
  const itemUrl = sortedLinks.find(link => !!link);
  if (!itemUrl) {
    return undefined;
  }

  // convert relative url to absolute url
  const url = new URL(itemUrl, feedUrl).href;
  if (!validateUrl(url)) {
    return undefined;
  }

  return url;
};

// get author
const getAuthor = (author: RssFeedItemAuthor) => {
  if (typeof author === 'string') {
    return author;
  }
  return author.name;
};

const getThumbnail = (item: RssFeedItem) => {
  if (item['media:thumbnail']) {
    return item['media:thumbnail'].$.url;
  }

  if (item['media:content']) {
    return item['media:content'].find(
      (media: any) => media.$?.medium === 'image'
    )?.$.url;
  }

  return undefined;
};

export const isOldItem = (
  item: RssFeedItem,
  mostRecentItemTimestamp: number
) => {
  // always fetch items without isoDate
  if (!item.isoDate) {
    return false;
  }

  const publishedAt = new Date(item.isoDate);

  // don't fetch older than 4 days items for new feeds
  if (!mostRecentItemTimestamp) {
    return publishedAt < new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  }

  // don't fetch existing items for old feeds
  return publishedAt <= new Date(mostRecentItemTimestamp);
};

const getUpdateFrequency = (feed: RssFeed) => {
  const updateFrequency =
    feed['syn:updateFrequency'] || feed['sy:updateFrequency'];

  if (!updateFrequency) {
    return 1;
  }

  const frequency = parseInt(updateFrequency, 10);
  if (isNaN(frequency)) {
    return 1;
  }

  return frequency;
};

const getUpdatePeriodInHours = (feed: RssFeed) => {
  const updatePeriod = feed['syn:updatePeriod'] || feed['sy:updatePeriod'];

  switch (updatePeriod) {
    case 'hourly':
      return 1;
    case 'daily':
      return 24;
    case 'weekly':
      return 7 * 24;
    case 'monthly':
      return 30 * 24;
    case 'yearly':
      return 365 * 24;
    default:
      // default to hourly
      return 1;
  }
};
