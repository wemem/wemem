import { tagColors } from '@affine/core/components/affine/page-properties/common';
import { createEmptyCollection } from '@affine/core/components/page-list';
import { FeedsService } from '@affine/core/modules/feed/services/feeds-service';
import type { FeedRecord } from '@affine/core/modules/feed-newly/views/data-hooks';
import { TagService } from '@affine/core/modules/tag';
import type { DocCollection } from '@blocksuite/store';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { useNavigateHelper } from '../../hooks/use-navigate-helper';

export const FeedFilterTagPrefix = 'feed-filter-tag-';

export const useSubscribeToFeed = (docCollection: DocCollection) => {
  const navigateHelper = useNavigateHelper();
  const feedsService = useService(FeedsService);
  const tagList = useService(TagService).tagList;

  return useCallback(
    (feedRecord: FeedRecord) => {
      if (feedsService.hasSubscribe(feedRecord.id)) {
        return;
      }
      const id = feedRecord.id;
      feedsService.subscribe(
        createEmptyCollection(id, {
          name: feedRecord.name,
          feed: {
            url: feedRecord.url,
            description: feedRecord.description,
            icon: feedRecord.icon,
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
                  value: [feedRecord.url],
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
    [docCollection.id, feedsService, navigateHelper, tagList]
  );
};
