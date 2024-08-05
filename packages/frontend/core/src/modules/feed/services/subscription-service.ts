import type { Collection } from '@affine/env/filter';
import type { WorkspaceService } from '@toeverything/infra';
import { LiveData, Service } from '@toeverything/infra';
import { Observable } from 'rxjs';
import { Array as YArray } from 'yjs';

const SETTING_KEY = 'setting';

const SUBSCRIPTIONS_KEY = 'subscriptions';
const SUBSCRIPTIONS_AFTER_CURSOR_KEY = 'subscriptionAfterCursor';

export class SubscriptionService extends Service {
  constructor(private readonly workspaceService: WorkspaceService) {
    super();
  }

  private get doc() {
    return this.workspaceService.workspace.docCollection.doc;
  }

  private get setting() {
    return this.workspaceService.workspace.docCollection.doc.getMap(
      SETTING_KEY
    );
  }

  private get subscriptionsYArray(): YArray<Collection> | undefined {
    return this.setting.get(SUBSCRIPTIONS_KEY) as YArray<Collection>;
  }

  private get afterCursor(): string | undefined {
    return this.setting.get(SUBSCRIPTIONS_AFTER_CURSOR_KEY) as string;
  }

  readonly afterCursor$ = LiveData.from(
    new Observable<string>(subscriber => {
      subscriber.next(this.afterCursor || '0');
      const fn = () => {
        subscriber.next(this.afterCursor || '0');
      };
      this.setting.observeDeep(fn);
      return () => {
        this.setting.unobserveDeep(fn);
      };
    }),
    '0'
  );

  public updateAfterCursor(cursor: string) {
    this.setting.set(SUBSCRIPTIONS_AFTER_CURSOR_KEY, cursor);
  }

  readonly subscriptions$ = LiveData.from(
    new Observable<Collection[]>(subscriber => {
      subscriber.next(this.subscriptionsYArray?.toArray() ?? []);
      const fn = () => {
        subscriber.next(this.subscriptionsYArray?.toArray() ?? []);
      };
      this.setting.observeDeep(fn);
      return () => {
        this.setting.unobserveDeep(fn);
      };
    }),
    []
  );

  subscriptionById$(subscriptionId?: string) {
    if (!subscriptionId) {
      return;
    }
    return this.subscriptions$.map(subscription =>
      subscription.find(item => item.id === subscriptionId)
    );
  }

  subscribe(...collections: Collection[]) {
    if (!this.setting.has(SUBSCRIPTIONS_KEY)) {
      this.setting.set(SUBSCRIPTIONS_KEY, new YArray());
    }
    this.doc.transact(() => {
      this.subscriptionsYArray?.insert(0, collections);
    });
  }

  updateSubscription(id: string, updater: (value: Collection) => Collection) {
    if (this.subscriptionsYArray) {
      updateFirstOfYArray(
        this.subscriptionsYArray,
        v => v.id === id,
        v => {
          return updater(v);
        }
      );
    }
  }

  hasSubscribe(id: string) {
    return this.subscriptionsYArray?.toArray().some(v => v.id === id) ?? false;
  }

  unsubscribe(...ids: string[]) {
    const subscriptionsYArray = this.subscriptionsYArray;
    if (!subscriptionsYArray) {
      return;
    }
    const set = new Set(ids);
    this.workspaceService.workspace.docCollection.doc.transact(() => {
      const indexList: number[] = [];
      subscriptionsYArray.forEach((feed, i) => {
        if (set.has(feed.id)) {
          set.delete(feed.id);
          indexList.unshift(i);
        }
      });
      indexList.forEach(i => {
        subscriptionsYArray.delete(i);
      });
    });
  }
}

const updateFirstOfYArray = <T>(
  array: YArray<T>,
  p: (value: T) => boolean,
  update: (value: T) => T
) => {
  array.doc?.transact(() => {
    for (let i = 0; i < array.length; i++) {
      const ele = array.get(i);
      if (p(ele)) {
        array.delete(i);
        array.insert(i, [update(ele)]);
        return;
      }
    }
  });
};
