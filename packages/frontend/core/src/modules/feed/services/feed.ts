import type { Collection } from '@affine/env/filter';
import type { WorkspaceService } from '@toeverything/infra';
import { LiveData, Service } from '@toeverything/infra';
import { Observable } from 'rxjs';
import { Array as YArray } from 'yjs';

const SETTING_KEY = 'setting';

const FEEDS_KEY = 'feeds';

export class FeedService extends Service {
  constructor(private readonly workspaceService: WorkspaceService) {
    super();
  }

  private get doc() {
    return this.workspaceService.workspace.docCollection.doc;
  }

  private get setting() {
    return this.workspaceService.workspace.docCollection.doc.getMap(
      SETTING_KEY,
    );
  }

  private get feedsYArray(): YArray<Collection> | undefined {
    return this.setting.get(FEEDS_KEY) as YArray<Collection>;
  }

  readonly feeds$ = LiveData.from(
    new Observable<Collection[]>(subscriber => {
      subscriber.next(this.feedsYArray?.toArray() ?? []);
      const fn = () => {
        subscriber.next(this.feedsYArray?.toArray() ?? []);
      };
      this.setting.observeDeep(fn);
      return () => {
        this.setting.unobserveDeep(fn);
      };
    }),
    [],
  );

  addFeed(...collections: Collection[]) {
    if (!this.setting.has(FEEDS_KEY)) {
      this.setting.set(FEEDS_KEY, new YArray());
    }
    this.doc.transact(() => {
      this.feedsYArray?.insert(0, collections);
    });
  }

  updateFeed(id: string, updater: (value: Collection) => Collection) {
    if (this.feedsYArray) {
      updateFirstOfYArray(
        this.feedsYArray,
        v => v.id === id,
        v => {
          return updater(v);
        },
      );
    }
  }

  deleteFeed(...ids: string[]) {
    const feedsYArray = this.feedsYArray;
    if (!feedsYArray) {
      return;
    }
    const set = new Set(ids);
    this.workspaceService.workspace.docCollection.doc.transact(() => {
      const indexList: number[] = [];
      feedsYArray.forEach((feed, i) => {
        if (set.has(feed.id)) {
          set.delete(feed.id);
          indexList.unshift(i);
        }
      });
      indexList.forEach(i => {
        feedsYArray.delete(i);
      });
    });
  }
}

const updateFirstOfYArray = <T>(
  array: YArray<T>,
  p: (value: T) => boolean,
  update: (value: T) => T,
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
