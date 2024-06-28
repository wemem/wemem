import { Button, type ButtonProps, useConfirmModal } from '@affine/component';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { SubscriptionService } from '@affine/core/modules/cloud';
import { mixpanel } from '@affine/core/utils';
import { SubscriptionPlan } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { useService } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { useState } from 'react';

export interface AICancelProps extends ButtonProps {}
export const AICancel = ({ ...btnProps }: AICancelProps) => {
  const t = useI18n();
  const [isMutating, setMutating] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(nanoid());
  const subscription = useService(SubscriptionService).subscription;

  const { openConfirmModal } = useConfirmModal();

  const cancel = useAsyncCallback(async () => {
    mixpanel.track('PlanChangeStarted', {
      segment: 'settings panel',
      control: 'plan cancel action',
      type: subscription.ai$.value?.plan,
      category: subscription.ai$.value?.recurring,
    });
    openConfirmModal({
      title: t['com.affine.payment.ai.action.cancel.confirm.title'](),
      description:
        t['com.affine.payment.ai.action.cancel.confirm.description'](),
      reverseFooter: true,
      confirmButtonOptions: {
        children:
          t['com.affine.payment.ai.action.cancel.confirm.confirm-text'](),
        type: 'default',
      },
      cancelText:
        t['com.affine.payment.ai.action.cancel.confirm.cancel-text'](),
      cancelButtonOptions: {
        type: 'primary',
      },
      onConfirm: async () => {
        try {
          setMutating(true);
          await subscription.cancelSubscription(
            idempotencyKey,
            SubscriptionPlan.AI
          );
          setIdempotencyKey(nanoid());
          mixpanel.track('ChangePlanSucceeded', {
            segment: 'settings panel',
            control: 'plan cancel action',
          });
        } finally {
          setMutating(false);
        }
      },
    });
  }, [openConfirmModal, t, subscription, idempotencyKey]);

  return (
    <Button onClick={cancel} loading={isMutating} type="primary" {...btnProps}>
      {t['com.affine.payment.ai.action.cancel.button-label']()}
    </Button>
  );
};
