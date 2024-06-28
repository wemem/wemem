import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { mixpanel } from '@affine/core/utils';
import { useService } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { SubscriptionService } from '../../../../../modules/cloud';
import { ConfirmLoadingModal, DowngradeModal } from './modals';

/**
 * Cancel action with modal & request
 * @param param0
 * @returns
 */
export const CancelAction = ({
  children,
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & PropsWithChildren) => {
  const [idempotencyKey, setIdempotencyKey] = useState(nanoid());
  const [isMutating, setIsMutating] = useState(false);
  const subscription = useService(SubscriptionService).subscription;

  const downgrade = useAsyncCallback(async () => {
    try {
      setIsMutating(true);
      await subscription.cancelSubscription(idempotencyKey);
      subscription.revalidate();
      await subscription.isRevalidating$.waitFor(v => !v);
      // refresh idempotency key
      setIdempotencyKey(nanoid());
      onOpenChange(false);
      mixpanel.track('ChangePlanSucceeded', {
        segment: 'settings panel',
        module: 'pricing plan list',
        control: 'plan cancel action',
        type: subscription.pro$.value?.plan,
        category: subscription.pro$.value?.recurring,
      });
    } finally {
      setIsMutating(false);
    }
  }, [subscription, idempotencyKey, onOpenChange]);

  return (
    <>
      {children}
      <DowngradeModal
        open={open}
        onCancel={downgrade}
        onOpenChange={onOpenChange}
        loading={isMutating}
      />
    </>
  );
};

/**
 * Resume payment action with modal & request
 * @param param0
 * @returns
 */
export const ResumeAction = ({
  children,
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & PropsWithChildren) => {
  // allow replay request on network error until component unmount or success
  const [idempotencyKey, setIdempotencyKey] = useState(nanoid());
  const [isMutating, setIsMutating] = useState(false);
  const subscription = useService(SubscriptionService).subscription;

  const resume = useAsyncCallback(async () => {
    try {
      setIsMutating(true);
      await subscription.resumeSubscription(idempotencyKey);
      subscription.revalidate();
      await subscription.isRevalidating$.waitFor(v => !v);
      // refresh idempotency key
      setIdempotencyKey(nanoid());
      onOpenChange(false);
      mixpanel.track('ChangePlanSucceeded', {
        segment: 'settings panel',
        module: 'pricing plan list',
        control: 'plan resume action',
        type: subscription.pro$.value?.plan,
        category: subscription.pro$.value?.recurring,
      });
    } finally {
      setIsMutating(false);
    }
  }, [subscription, idempotencyKey, onOpenChange]);

  return (
    <>
      {children}
      <ConfirmLoadingModal
        type={'resume'}
        open={open}
        onConfirm={resume}
        onOpenChange={onOpenChange}
        loading={isMutating}
      />
    </>
  );
};
