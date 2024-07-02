import { tagColors } from '@affine/core/components/affine/page-properties/common';
import { createEmptyCollection } from '@affine/core/components/page-list';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import type { FeedRecord } from '@affine/core/modules/feed/new-feed/views/data-hooks';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import { TagService } from '@affine/core/modules/tag';
import type { DocCollection } from '@blocksuite/store';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

export const FeedFilterTagPrefix = 'feed-filter-tag-';

export const useCreateFeed = (docCollection: DocCollection) => {
  const navigateHelper = useNavigateHelper();
  const feedService = useService(FeedService);
  const tagList = useService(TagService).tagList;

  return useCallback(
    (feed: FeedRecord) => {
      if (feedService.hasFeed(feed.id)) {
        return;
      }
      const id = feed.id;
      feedService.addFeed(
        createEmptyCollection(id, {
          name: feed.title,
          feed: {
            description: feed.description,
            image: feed.image,
          },
          filterList: [
            {
              type: 'filter',
              left: {
                type: 'ref',
                name: 'Tags',
              },
              funcName: 'contains all',
              args: [
                {
                  type: 'literal',
                  value: [id],
                },
              ],
            },
          ],
        })
      );
      tagList.createGhostTagWithId(
        id,
        `${FeedFilterTagPrefix}${id}`,
        tagColors[0][1]
      );
      navigateHelper.jumpToFeed(docCollection.id, id);
    },
    [docCollection.id, feedService, navigateHelper, tagList]
  );
};
