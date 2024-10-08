import { tagColors } from '@affine/core/components/affine/page-properties/common';
import { createEmptyCollection } from '@affine/core/components/page-list';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { FeedsService } from '@affine/core/modules/feed/services/feeds-service';
import type { SubscriptionRecord } from '@affine/core/modules/feed-newly/views/data-hooks';
import { TagService } from '@affine/core/modules/tag';
import type { DocCollection } from '@blocksuite/store';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

export const FeedFilterTagPrefix = 'feed-filter-tag-';

export const useSubscribeToFeed = (docCollection: DocCollection) => {
  const navigateHelper = useNavigateHelper();
  const subscriptionService = useService(FeedsService);
  const tagList = useService(TagService).tagList;

  return useCallback(
    (subscription: SubscriptionRecord) => {
      if (subscriptionService.hasSubscribe(subscription.id)) {
        return;
      }
      const id = subscription.id;
      subscriptionService.subscribe(
        createEmptyCollection(id, {
          name: subscription.name,
          subscription: {
            url: subscription.url,
            description: subscription.description,
            icon: subscription.icon,
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
                  value: [subscription.url],
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
    [docCollection.id, subscriptionService, navigateHelper, tagList]
  );
};
