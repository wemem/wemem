import { generateFractionalIndexingKeyBetween } from '@affine/core/utils';
import { Entity, LiveData } from '@toeverything/infra';
import { map, switchMap } from 'rxjs';

import type { Feed, FeedNodesStore } from '../stores/feed-node';

export class FeedNode extends Entity<{
  id: string | null;
}> {
  id = this.props.id;

  info$ = LiveData.from<Feed | null>(
    this.nodesStore.watchNodeInfo(this.id ?? ''),
    null
  );
  type$ = this.info$.map(info =>
    this.id === null ? 'feedFolder' : (info?.type ?? '')
  );
  name$ = this.info$.map(info => info?.name);
  description$ = this.info$.map(info => info?.description);
  icon$ = this.info$.map(info => info?.icon);
  index$ = this.info$.map(info => info?.index ?? '');
  url$ = this.info$.map(info => info?.url ?? '');

  children$ = LiveData.from<FeedNode[]>(
    // watch children if this is a folder, otherwise return empty array
    this.type$.pipe(
      switchMap(() =>
        this.nodesStore
          .watchNodeChildren(this.id)
          .pipe(
            map(children =>
              children
                .filter(e => this.filterInvalidChildren(e))
                .map(child => this.framework.createEntity(FeedNode, child))
            )
          )
          .pipe()
      )
    ),
    []
  );

  sortedChildren$ = LiveData.computed(get => {
    return get(this.children$)
      .map(node => [node, get(node.index$)] as const)
      .sort((a, b) => (a[1] > b[1] ? 1 : -1))
      .map(([node]) => node);
  });

  constructor(readonly nodesStore: FeedNodesStore) {
    super();
  }

  contains(childId: string | null): boolean {
    if (!this.id) {
      return true;
    }
    if (!childId) {
      return false;
    }
    return this.nodesStore.isAncestor(childId, this.id);
  }

  beChildOf(parentId: string | null): boolean {
    if (!this.id) {
      return false;
    }
    if (!parentId) {
      return true;
    }
    return this.nodesStore.isAncestor(this.id, parentId);
  }

  filterInvalidChildren(child: { type: string }): boolean {
    if (
      this.id === null &&
      child.type !== 'feedFolder' &&
      child.type !== 'feed'
    ) {
      return false; // root node can only have folders and feeds
    }
    return true;
  }

  createFolder(name: string, index: string) {
    if (this.type$.value !== 'feedFolder') {
      throw new Error('Cannot create folder on non-folder node');
    }
    return this.nodesStore.createFolder(this.id, name, index);
  }

  createFeed(
    id: string,
    name: string,
    url: string,
    description: string | null,
    icon: string | null
  ) {
    if (this.type$.value !== 'feedFolder') {
      throw new Error('Cannot create link on non-folder node');
    }
    return this.nodesStore.createFeed(
      this.id,
      id,
      name,
      url,
      description,
      icon,
      this.indexAt('before')
    );
  }

  delete() {
    if (this.id === null) {
      throw new Error('Cannot delete root node');
    }
    if (this.type$.value === 'feedFolder') {
      this.nodesStore.removeFolder(this.id);
    } else {
      this.nodesStore.removeFeed(this.id);
    }
  }

  moveHere(childId: string, index: string) {
    this.nodesStore.moveNode(childId, this.id, index);
  }

  rename(name: string) {
    if (this.id === null) {
      throw new Error('Cannot rename root node');
    }
    this.nodesStore.renameNode(this.id, name);
  }

  indexAt(at: 'before' | 'after', targetId?: string) {
    if (!targetId) {
      if (at === 'before') {
        const first = this.sortedChildren$.value.at(0);
        return generateFractionalIndexingKeyBetween(
          null,
          first?.index$.value || null
        );
      } else {
        const last = this.sortedChildren$.value.at(-1);
        return generateFractionalIndexingKeyBetween(
          last?.index$.value || null,
          null
        );
      }
    } else {
      const sortedChildren = this.sortedChildren$.value;
      const targetIndex = sortedChildren.findIndex(
        node => node.id === targetId
      );
      if (targetIndex === -1) {
        throw new Error('Target node not found');
      }
      const target = sortedChildren[targetIndex];
      const before: FeedNode | null = sortedChildren[targetIndex - 1] || null;
      const after: FeedNode | null = sortedChildren[targetIndex + 1] || null;
      if (at === 'before') {
        return generateFractionalIndexingKeyBetween(
          before?.index$.value || null,
          target.index$.value
        );
      } else {
        return generateFractionalIndexingKeyBetween(
          target.index$.value,
          after?.index$.value || null
        );
      }
    }
  }
}
