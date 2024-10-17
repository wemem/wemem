import type { GetWorkspacePageMetaByIdQuery } from '@affine/graphql';
import type { DocService, GlobalCache } from '@toeverything/infra';
import {
  backoffRetry,
  catchErrorInto,
  effect,
  Entity,
  exhaustMapWithTrailing,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { EMPTY, mergeMap } from 'rxjs';

import { isBackendError, isNetworkError } from '../error';
import type { CloudDocMetaStore } from '../stores/cloud-doc-meta';

export type CloudDocMetaType =
  GetWorkspacePageMetaByIdQuery['workspace']['pageMeta'];

const CACHE_KEY_PREFIX = 'cloud-doc-meta:';

export class CloudDocMeta extends Entity {
  constructor(
    private readonly store: CloudDocMetaStore,
    private readonly docService: DocService,
    private readonly cache: GlobalCache
  ) {
    super();
  }

  readonly docId = this.docService.doc.id;
  readonly workspaceId = this.docService.doc.workspace.id;

  readonly cacheKey = `${CACHE_KEY_PREFIX}${this.workspaceId}:${this.docId}`;
  meta$ = LiveData.from<CloudDocMetaType | undefined>(
    this.cache.watch<CloudDocMetaType>(this.cacheKey),
    undefined
  );
  isRevalidating$ = new LiveData(false);
  error$ = new LiveData<any | null>(null);

  revalidate = effect(
    exhaustMapWithTrailing(() => {
      return fromPromise(
        this.store.fetchCloudDocMeta(this.workspaceId, this.docId)
      ).pipe(
        backoffRetry({
          when: isNetworkError,
          count: Infinity,
        }),
        backoffRetry({
          when: isBackendError,
        }),
        mergeMap(meta => {
          this.cache.set<CloudDocMetaType>(this.cacheKey, meta);
          return EMPTY;
        }),
        catchErrorInto(this.error$),
        onStart(() => this.isRevalidating$.next(true)),
        onComplete(() => this.isRevalidating$.next(false))
      );
    })
  );
}
