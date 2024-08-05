import { SubscriptionService } from '@affine/core/modules/feed/services/subscription-service';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { useEditSubscriptionModal } from './use-edit-feed-modal';

export const useEditSubscription = (collection: Collection) => {
  const feedService = useService(SubscriptionService);
  const t = useI18n();
  const { node, open } = useEditSubscriptionModal({
    title: t['ai.readease.edit-subscription.editFeed'](),
    showTips: true,
  });

  const handleEditFeed = useCallback(() => {
    // use openRenameModal if it is in the sidebar collection list
    open(collection.name)
      .then(name => {
        return feedService.updateSubscription(collection.id, collection => ({
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
