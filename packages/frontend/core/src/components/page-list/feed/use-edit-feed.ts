import { FeedService } from '@affine/core/modules/feed/services/feed';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { useEditFeedModal } from './use-edit-feed-modal';

export const useEditFeed = (collection: Collection) => {
  const feedService = useService(FeedService);
  const t = useI18n();
  const { node, open } = useEditFeedModal({
    title: t['ai.readflow.editFeed.editFeed'](),
    showTips: true,
  });

  const handleEditFeed = useCallback(() => {
    // use openRenameModal if it is in the sidebar collection list
    open(collection.name)
      .then(name => {
        return feedService.updateFeed(collection.id, collection => ({
          ...collection,
          name,
        }));
      })
      .catch(err => {
        console.error(err);
      });
  }, [collection.id, collection.name, open, feedService]);

  return { node, handleEditFeed };
};
