import type { CollectionMeta } from '@affine/core/components/page-list';
import { SubscriptionService } from '@affine/core/modules/subscription/services/subscription-service';
import { useI18n } from '@affine/i18n';
import { useService } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import { EditSubscriptionModal } from './edit-subscription-modal';

export const useEditSubscription = (subscriptionMeta: CollectionMeta) => {
  const feedService = useService(SubscriptionService);
  const t = useI18n();
  const { node, open } = useEditSubscriptionModal({
    title: t['ai.readease.edit-subscription.editFeed'](),
    showTips: true,
  });

  const handleEditSubscription = useCallback(() => {
    open(subscriptionMeta.name)
      .then(name => {
        return feedService.updateSubscription(
          subscriptionMeta.id,
          collection => ({
            ...collection,
            name,
          })
        );
      })
      .catch(err => {
        console.error(err);
      });
  }, [subscriptionMeta.id, subscriptionMeta.name, open, feedService]);

  return { node, handleEditSubscription };
};

export const useEditSubscriptionModal = ({
  title,
  showTips,
}: {
  title: string;
  showTips?: boolean;
}) => {
  const [data, setData] = useState<{
    name: string;
    onConfirm: (name: string) => void;
  }>();
  const close = useCallback(() => setData(undefined), []);

  return {
    node: data ? (
      <EditSubscriptionModal
        showTips={showTips}
        title={title}
        init={data.name}
        open={!!data}
        onOpenChange={close}
        onConfirm={data.onConfirm}
      />
    ) : null,
    open: (name: string): Promise<string> =>
      new Promise<string>(res => {
        setData({
          name,
          onConfirm: feed => {
            res(feed);
          },
        });
      }),
  };
};
