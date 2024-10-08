import { FeedsService } from '@affine/core/modules/feed/services/feeds-service';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { useEditSubscriptionModal } from './use-edit-feed-modal';

export const useEditFeed = (collection: Collection) => {
  const feedService = useService(FeedsService);
  const t = useI18n();
  const { node, open } = useEditSubscriptionModal({
    title: t['ai.wemem.edit-feed.editFeed'](),
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
