import { tagColors } from '@affine/core/components/affine/page-properties/common';
import { createEmptyCollection, useCreateFeedModal } from '@affine/core/components/page-list';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import { TagService } from '@affine/core/modules/tag';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { DocCollection } from '@blocksuite/store';
import { useService } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { useCallback } from 'react';

export const FeedFilterTagPrefix = 'feed-filter-tag-';

export const useCreateFeed = (docCollection: DocCollection) => {
  const navigateHelper = useNavigateHelper();
  const feedService = useService(FeedService);
  const t = useAFFiNEI18N();
  const tagList = useService(TagService).tagList;
  const { node, open } = useCreateFeedModal({
    title: t['ai.readflow.editFeed.createFeed'](),
    showTips: true,
  });

  const handleCreateFeed = useCallback(() => {
    open('')
      .then(name => {
        const id = nanoid();
        feedService.addFeed(createEmptyCollection(id, {
          name, filterList: [{
            'type': 'filter',
            'left': {
              'type': 'ref',
              'name': 'Tags',
            },
            'funcName': 'contains all',
            'args': [{
              'type': 'literal',
              'value': [id],
            }],
          }],
        }));
        tagList.createGhostTagWithId(id, `${FeedFilterTagPrefix}${id}`, tagColors[0][1]);
        navigateHelper.jumpToFeed(docCollection.id, id);
      })
      .catch(err => {
        console.error(err);
      });
  }, [docCollection.id, feedService, navigateHelper, open, tagList]);
  return { node, handleCreateFeed };
};
