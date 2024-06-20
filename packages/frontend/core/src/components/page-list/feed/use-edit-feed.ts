import { FeedService } from '@affine/core/modules/feed/services/feed';
import type { Collection } from '@affine/env/filter';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { useEditFeedModal } from './use-edit-feed-modal';

export const useEditFeed = (collection: Collection) => {
  const feedService = useService(FeedService);
  const t = useAFFiNEI18N();
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
