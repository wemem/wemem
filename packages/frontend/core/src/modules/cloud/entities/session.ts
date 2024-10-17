import {
  backoffRetry,
  effect,
  Entity,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { isEqual } from 'lodash-es';
import { EMPTY, exhaustMap, mergeMap } from 'rxjs';

import { validateAndReduceImage } from '../../../utils/reduce-image';
import type { AccountProfile, AuthStore } from '../stores/auth';

export interface AuthSessionInfo {
  account: AuthAccountInfo;
}

export interface AuthAccountInfo {
  id: string;
  label: string;
  email?: string;
  info?: AccountProfile | null;
  avatar?: string | null;
}

export interface AuthSessionUnauthenticated {
  status: 'unauthenticated';
}

export interface AuthSessionAuthenticated {
  status: 'authenticated';
  session: AuthSessionInfo;
}

export class AuthSession extends Entity {
  id = 'affine-cloud' as const;

  session$: LiveData<AuthSessionUnauthenticated | AuthSessionAuthenticated> =
    LiveData.from(this.store.watchCachedAuthSession(), null).map(session =>
      session
        ? {
            status: 'authenticated',
            session: session as AuthSessionInfo,
          }
        : {
            status: 'unauthenticated',
          }
    );

  status$ = this.session$.map(session => session.status);

  account$ = this.session$.map(session =>
    session.status === 'authenticated' ? session.session.account : null
  );

  waitForAuthenticated = (signal?: AbortSignal) =>
    this.session$.waitFor(
      session => session.status === 'authenticated',
      signal
    ) as Promise<AuthSessionAuthenticated>;

  isRevalidating$ = new LiveData(false);

  constructor(private readonly store: AuthStore) {
    super();
  }

  revalidate = effect(
    exhaustMap(() =>
      fromPromise(this.getSession()).pipe(
        backoffRetry({
          count: Infinity,
        }),
        mergeMap(sessionInfo => {
          if (!isEqual(this.store.getCachedAuthSession(), sessionInfo)) {
            this.store.setCachedAuthSession(sessionInfo);
          }
          return EMPTY;
        }),
        onStart(() => {
          this.isRevalidating$.next(true);
        }),
        onComplete(() => {
          this.isRevalidating$.next(false);
        })
      )
    )
  );

  private async getSession(): Promise<AuthSessionInfo | null> {
    const session = await this.store.fetchSession();

    if (session?.user) {
      const account = {
        id: session.user.id,
        email: session.user.email,
        label: session.user.name,
        avatar: session.user.avatarUrl,
        info: session.user,
      };
      const result = {
        account,
      };
      return result;
    } else {
      return null;
    }
  }

  async waitForRevalidation(signal?: AbortSignal) {
    this.revalidate();
    await this.isRevalidating$.waitFor(
      isRevalidating => !isRevalidating,
      signal
    );
  }

  async removeAvatar() {
    await this.store.removeAvatar();
    await this.waitForRevalidation();
  }

  async uploadAvatar(file: File) {
    const reducedFile = await validateAndReduceImage(file);
    await this.store.uploadAvatar(reducedFile);
    await this.waitForRevalidation();
  }

  async updateLabel(label: string) {
    await this.store.updateLabel(label);
    console.log('updateLabel');
    await this.waitForRevalidation();
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
