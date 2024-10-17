import type { GetMembersByWorkspaceIdQuery } from '@affine/graphql';
import type { WorkspaceService } from '@toeverything/infra';
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

import { isBackendError, isNetworkError } from '../../cloud';
import type { WorkspaceMembersStore } from '../stores/members';

export type Member =
  GetMembersByWorkspaceIdQuery['workspace']['members'][number];

export class WorkspaceMembers extends Entity {
  constructor(
    private readonly store: WorkspaceMembersStore,
    private readonly workspaceService: WorkspaceService
  ) {
    super();
  }

  pageNum$ = new LiveData(0);
  memberCount$ = new LiveData<number | undefined>(undefined);
  pageMembers$ = new LiveData<Member[] | undefined>(undefined);

  isLoading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  readonly PAGE_SIZE = 8;

  readonly revalidate = effect(
    map(() => this.pageNum$.value),
    exhaustMapSwitchUntilChanged(
      (a, b) => a === b,
      pageNum => {
        return fromPromise(async signal => {
          return this.store.fetchMembers(
            this.workspaceService.workspace.id,
            pageNum * this.PAGE_SIZE,
            this.PAGE_SIZE,
            signal
          );
        }).pipe(
          mergeMap(data => {
            this.memberCount$.setValue(data.memberCount);
            this.pageMembers$.setValue(data.members);
            return EMPTY;
          }),
          backoffRetry({
            when: isNetworkError,
            count: Infinity,
          }),
          backoffRetry({
            when: isBackendError,
          }),
          catchErrorInto(this.error$),
          onStart(() => {
            this.pageMembers$.setValue(undefined);
            this.isLoading$.setValue(true);
          }),
          onComplete(() => this.isLoading$.setValue(false))
        );
      }
    )
  );

  setPageNum(pageNum: number) {
    this.pageNum$.setValue(pageNum);
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
