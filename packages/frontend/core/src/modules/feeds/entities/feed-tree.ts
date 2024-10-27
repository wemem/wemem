import { Entity, LiveData } from '@toeverything/infra';
import { map } from 'rxjs';

import type { FeedNodesStore } from '../stores/feed-node';
import { FeedNode } from './feed-node';

export class FeedTree extends Entity {
  constructor(private readonly folderStore: FeedNodesStore) {
    super();
  }

  readonly rootFolder = this.framework.createEntity(FeedNode, {
    id: null,
  });

  isLoading$ = this.folderStore.watchIsLoading();

  // get node by id
  nodeById$(id: string) {
    return LiveData.from(
      this.folderStore.watchNodeInfo(id).pipe(
        map(info => {
          if (!info) {
            return null;
          }
          return this.framework.createEntity(FeedNode, {
            ...info,
          });
        })
      ),
      null
    );
  }

  folderNodeById(id: string): FeedNode | null {
    const feed = this.folderStore.folderById(id);
    if (!feed) {
      return null;
    }
    return this.framework.createEntity(FeedNode, feed);
  }

  feedNodeById(id: string): FeedNode | null {
    const feed = this.folderStore.feedById(id);
    if (!feed) {
      return null;
    }
    return this.framework.createEntity(FeedNode, feed);
  }

  feedNodeByUrl(feedUrl: string): FeedNode | null {
    const feed = this.folderStore.feedByUrl(feedUrl);
    if (!feed) {
      return null;
    }
    return this.framework.createEntity(FeedNode, feed);
  }
}
