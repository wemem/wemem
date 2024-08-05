import { SubscriptionService } from '@affine/core/modules/feed/services/subscription-service';
import { TagService } from '@affine/core/modules/tag';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

export const useUnsubscribe = () => {
  const subscriptionService = useService(SubscriptionService);
  const tagList = useService(TagService).tagList;
  return useCallback(
    (...ids: string[]) => {
      subscriptionService.unsubscribe(...ids);
      ids.map(id => tagList.deleteTag(id));
    },
    [subscriptionService, tagList]
  );
};
