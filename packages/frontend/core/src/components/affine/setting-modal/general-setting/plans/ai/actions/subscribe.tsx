import { Button, type ButtonProps } from '@affine/component';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { SubscriptionService } from '@affine/core/modules/cloud';
import { mixpanel, popupWindow } from '@affine/core/utils';
import { SubscriptionPlan, SubscriptionRecurring } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';

export interface AISubscribeProps extends ButtonProps {}

export const AISubscribe = ({ ...btnProps }: AISubscribeProps) => {
  const [idempotencyKey, setIdempotencyKey] = useState(nanoid());
  const [isMutating, setMutating] = useState(false);
  const [isOpenedExternalWindow, setOpenedExternalWindow] = useState(false);

  const subscriptionService = useService(SubscriptionService);
  const price = useLiveData(subscriptionService.prices.aiPrice$);
  useEffect(() => {
    subscriptionService.prices.revalidate();
  }, [subscriptionService]);

  const t = useI18n();

  useEffect(() => {
    if (isOpenedExternalWindow) {
      // when the external window is opened, revalidate the subscription when window get focus
      window.addEventListener(
        'focus',
        subscriptionService.subscription.revalidate
      );
      return () => {
        window.removeEventListener(
          'focus',
          subscriptionService.subscription.revalidate
        );
      };
    }
    return;
  }, [isOpenedExternalWindow, subscriptionService]);

  const subscribe = useAsyncCallback(async () => {
    setMutating(true);
    mixpanel.track('PlanUpgradeStarted', {
      category: SubscriptionRecurring.Yearly,
      type: SubscriptionPlan.AI,
    });
    try {
      const session = await subscriptionService.createCheckoutSession({
        recurring: SubscriptionRecurring.Yearly,
        idempotencyKey,
        plan: SubscriptionPlan.AI,
        coupon: null,
        successCallbackLink: '/ai-upgrade-success',
      });
      popupWindow(session);
      setOpenedExternalWindow(true);
      setIdempotencyKey(nanoid());
    } finally {
      setMutating(false);
    }
  }, [idempotencyKey, subscriptionService]);

  if (!price || !price.yearlyAmount) {
    // TODO(@catsjuice): loading UI
    return null;
  }

  const priceReadable = `$${(price.yearlyAmount / 100).toFixed(2)}`;
  const priceFrequency = t['com.affine.payment.billing-setting.year']();

  return (
    <Button
      loading={isMutating}
      onClick={subscribe}
      type="primary"
      {...btnProps}
    >
      {btnProps.children ?? `${priceReadable} / ${priceFrequency}`}
    </Button>
  );
};
