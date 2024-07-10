import { type SubscriptionQuery, SubscriptionRecurring } from '@affine/graphql';
import { SubscriptionPlan } from '@affine/graphql';
import {
  backoffRetry,
  catchErrorInto,
  effect,
  Entity,
  exhaustMapSwitchUntilChanged,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { EMPTY, map, mergeMap } from 'rxjs';

import { isBackendError, isNetworkError } from '../error';
import type { AuthService } from '../services/auth';
import type { ServerConfigService } from '../services/server-config';
import type { SubscriptionStore } from '../stores/subscription';

export type SubscriptionType = NonNullable<
  SubscriptionQuery['currentUser']
>['subscriptions'][number];

export class Subscription extends Entity {
  // undefined means no user, null means loading
  subscription$ = new LiveData<SubscriptionType[] | null | undefined>(null);
  isRevalidating$ = new LiveData(false);
  error$ = new LiveData<any | null>(null);

  pro$ = this.subscription$.map(subscriptions =>
    subscriptions
      ? subscriptions.find(sub => sub.plan === SubscriptionPlan.Pro)
      : null
  );
  ai$ = this.subscription$.map(subscriptions =>
    subscriptions
      ? subscriptions.find(sub => sub.plan === SubscriptionPlan.AI)
      : null
  );
  isBeliever$ = this.pro$.map(
    sub => sub?.recurring === SubscriptionRecurring.Lifetime
  );

  constructor(
    private readonly authService: AuthService,
    private readonly serverConfigService: ServerConfigService,
    private readonly store: SubscriptionStore
  ) {
    super();
  }

  async resumeSubscription(idempotencyKey: string, plan?: SubscriptionPlan) {
    await this.store.mutateResumeSubscription(idempotencyKey, plan);
    await this.waitForRevalidation();
  }

  async cancelSubscription(idempotencyKey: string, plan?: SubscriptionPlan) {
    await this.store.mutateCancelSubscription(idempotencyKey, plan);
    await this.waitForRevalidation();
  }

  async setSubscriptionRecurring(
    idempotencyKey: string,
    recurring: SubscriptionRecurring,
    plan?: SubscriptionPlan
  ) {
    await this.store.setSubscriptionRecurring(idempotencyKey, recurring, plan);
    await this.waitForRevalidation();
  }

  async waitForRevalidation(signal?: AbortSignal) {
    this.revalidate();
    await this.isRevalidating$.waitFor(
      isRevalidating => !isRevalidating,
      signal
    );
  }

  revalidate = effect(
    map(() => ({
      accountId: this.authService.session.account$.value?.id,
    })),
    exhaustMapSwitchUntilChanged(
      (a, b) => a.accountId === b.accountId,
      ({ accountId }) => {
        return fromPromise(async signal => {
          if (!accountId) {
            return undefined; // no subscription if no user
          }

          const serverConfig =
            await this.serverConfigService.serverConfig.features$.waitForNonNull(
              signal
            );

          if (!serverConfig.payment) {
            // No payment feature, no subscription
            return {
              userId: accountId,
              subscriptions: [],
            };
          }
          const { userId, subscriptions } =
            await this.store.fetchSubscriptions(signal);
          if (userId !== accountId) {
            // The user has changed, ignore the result
            this.authService.session.revalidate();
            await this.authService.session.waitForRevalidation();
            return null;
          }
          return {
            userId: userId,
            subscriptions: subscriptions,
          };
        }).pipe(
          backoffRetry({
            when: isNetworkError,
            count: Infinity,
          }),
          backoffRetry({
            when: isBackendError,
          }),
          mergeMap(data => {
            if (data) {
              this.store.setCachedSubscriptions(
                data.userId,
                data.subscriptions
              );
              this.subscription$.next(data.subscriptions);
            } else {
              this.subscription$.next(undefined);
            }
            return EMPTY;
          }),
          catchErrorInto(this.error$),
          onStart(() => this.isRevalidating$.next(true)),
          onComplete(() => this.isRevalidating$.next(false))
        );
      },
      ({ accountId }) => {
        this.reset();
        if (!accountId) {
          this.subscription$.next(null);
        } else {
          this.subscription$.next(this.store.getCachedSubscriptions(accountId));
        }
      }
    )
  );

  reset() {
    this.subscription$.next(null);
    this.isRevalidating$.next(false);
    this.error$.next(null);
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
