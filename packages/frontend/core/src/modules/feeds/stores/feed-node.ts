import type { WorkspaceDBService } from '@toeverything/infra';
import { Store } from '@toeverything/infra';

export type Feed = {
  name: string; // for feed folder is the folder name, for feed is the feed name
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: (string & {}) | 'feedFolder' | 'feed';
  index: string;
  id: string;
  url?: string | null; // only for feed type
  description?: string | null; // for feed type
  icon?: string | null; // for feed type
  parentId?: string | null;
  createdAt: number;
  updatedAt?: number | null;
};

export class FeedNodesStore extends Store {
  constructor(private readonly dbService: WorkspaceDBService) {
    super();
  }

  watchNodeInfo(nodeId: string) {
    return this.dbService.db.feedNodes.get$(nodeId);
  }

  watchNodeChildren(parentId: string | null) {
    return this.dbService.db.feedNodes.find$({
      parentId: parentId,
    });
  }

  watchIsLoading() {
    return this.dbService.db.feedNodes.isLoading$;
  }

  feedByUrl(feedUrl: string) {
    const [feed] = this.dbService.db.feedNodes.find({
      url: feedUrl,
      type: 'feed',
    });
    return feed || null;
  }

  folderById(folderId: string) {
    const [feed] = this.dbService.db.feedNodes.find({
      id: folderId,
      type: 'feedFolder',
    });
    return feed || null;
  }

  feedById(feedId: string) {
    const [feed] = this.dbService.db.feedNodes.find({
      id: feedId,
      type: 'feed',
    });
    return feed || null;
  }

  isAncestor(childId: string, ancestorId: string): boolean {
    if (childId === ancestorId) {
      return false;
    }
    const history = new Set<string>([childId]);
    let current: string = childId;
    while (current) {
      const info = this.dbService.db.feedNodes.get(current);
      if (info === null || !info.parentId) {
        return false;
      }
      current = info.parentId;
      if (history.has(current)) {
        return false; // loop detected
      }
      history.add(current);
      if (current === ancestorId) {
        return true;
      }
    }
    return false;
  }

  renameNode(nodeId: string, name: string) {
    const node = this.dbService.db.feedNodes.get(nodeId);
    if (node === null) {
      throw new Error('Node not found');
    }
    if (node.type !== 'feedFolder' && node.type !== 'feed') {
      throw new Error('Cannot rename non-feed or non-folder node');
    }
    this.dbService.db.feedNodes.update(nodeId, {
      name: name,
      updatedAt: Date.now(),
    });
  }

  createFolder(parentId: string | null, name: string, index: string) {
    if (parentId) {
      const parent = this.dbService.db.feedNodes.get(parentId);
      if (parent === null || parent.type !== 'feedFolder') {
        throw new Error('Parent folder not found');
      }
    }

    return this.dbService.db.feedNodes.create({
      parentId: parentId,
      type: 'feedFolder',
      name: name,
      index: index,
      createdAt: Date.now(),
    }).id;
  }

  createFeed(
    parentId: string | null,
    feedId: string,
    name: string,
    url: string,
    description: string | null,
    icon: string | null,
    index: string
  ) {
    if (parentId) {
      const parent = this.dbService.db.feedNodes.get(parentId);
      if (parent === null || parent.type !== 'feedFolder') {
        throw new Error('Parent folder not found');
      }
    }

    return this.dbService.db.feedNodes.create({
      parentId: parentId,
      type: 'feed',
      name: name,
      url: url,
      description: description ?? undefined,
      icon: icon ?? undefined,
      index: index,
      createdAt: Date.now(),
      id: feedId,
    }).id;
  }

  removeFolder(folderId: string) {
    const info = this.dbService.db.feedNodes.get(folderId);
    if (info === null || info.type !== 'feedFolder') {
      throw new Error('Folder not found');
    }
    const stack = [info];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      if (current.type !== 'feedFolder') {
        this.dbService.db.feedNodes.delete(current.id);
      } else {
        const children = this.dbService.db.feedNodes.find({
          parentId: current.id,
        });
        stack.push(...children);
        this.dbService.db.feedNodes.delete(current.id);
      }
    }
  }

  removeFeed(feedId: string) {
    const feed = this.dbService.db.feedNodes.get(feedId);
    if (feed === null || feed.type !== 'feed') {
      throw new Error('Feed not found');
    }
    this.dbService.db.feedNodes.delete(feedId);
  }

  moveNode(nodeId: string, parentId: string | null, index: string) {
    const node = this.dbService.db.feedNodes.get(nodeId);
    if (node === null) {
      throw new Error('Node not found');
    }

    if (parentId) {
      if (nodeId === parentId) {
        throw new Error('Cannot move a node to itself');
      }
      if (this.isAncestor(parentId, nodeId)) {
        throw new Error('Cannot move a node to its descendant');
      }
      const parent = this.dbService.db.feedNodes.get(parentId);
      if (parent === null || parent.type !== 'feedFolder') {
        throw new Error('Parent folder not found');
      }
    } else {
      if (node.type !== 'feedFolder' && node.type !== 'feed') {
        throw new Error('Root node can only have folders');
      }
    }
    this.dbService.db.feedNodes.update(nodeId, {
      parentId,
      index,
      updatedAt: Date.now(),
    });
  }
}
