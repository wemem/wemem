import type { WorkspaceDBService } from '@toeverything/infra';
import { Store } from '@toeverything/infra';

export enum FeedNodeType {
  Folder = 'feedFolder',
  RSS = 'feedRss',
  Email = 'feedEmail',
}

export enum FeedExplorerType {
  Folder = 'explorer:feeds:folder',
  RSS = 'explorer:feeds:rss',
}

export type Feed = {
  name: string; // for feed folder is the folder name, for feed is the feed name
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: (string & {}) | FeedNodeType;
  index: string;
  id: string;
  source?: string | null; // only for feed type
  description?: string | null; // for feed type
  icon?: string | null; // for feed type
  parentId?: string | null;
  createdAt: number;
  updatedAt?: number | null;
  unreadCount?: number | null;
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

  rssNodeBySource(feedSource: string) {
    const [feed] = this.dbService.db.feedNodes.find({
      source: feedSource,
      type: FeedNodeType.RSS,
    });
    return feed || null;
  }

  folderById(folderId: string) {
    const [feed] = this.dbService.db.feedNodes.find({
      id: folderId,
      type: FeedNodeType.Folder,
    });
    return feed || null;
  }

  feedById(feedId: string) {
    const [feed] = this.dbService.db.feedNodes.find({
      id: feedId,
      type: FeedNodeType.RSS,
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
    if (node.type !== FeedNodeType.Folder && node.type !== FeedNodeType.RSS) {
      throw new Error('Cannot rename non-feed or non-folder node');
    }
    this.dbService.db.feedNodes.update(nodeId, {
      name: name,
      updatedAt: Date.now(),
    });
  }

  incrUnreadCount(nodeId: string, count: number) {
    const node = this.dbService.db.feedNodes.get(nodeId);
    if (node === null) {
      throw new Error('Node not found');
    }
    this.dbService.db.feedNodes.update(nodeId, {
      unreadCount: Math.max(0, (node.unreadCount || 0) + count),
      updatedAt: Date.now(),
    });
  }

  createFolder(parentId: string | null, name: string, index: string) {
    if (parentId) {
      const parent = this.dbService.db.feedNodes.get(parentId);
      if (parent === null || parent.type !== FeedNodeType.Folder) {
        throw new Error('Parent folder not found');
      }
    }

    return this.dbService.db.feedNodes.create({
      parentId: parentId,
      type: FeedNodeType.Folder,
      name: name,
      index: index,
      createdAt: Date.now(),
    }).id;
  }

  createRSS(
    parentId: string | null,
    feedId: string,
    name: string,
    source: string,
    description: string | null,
    icon: string | null,
    index: string
  ) {
    if (parentId) {
      const parent = this.dbService.db.feedNodes.get(parentId);
      if (parent === null || parent.type !== FeedNodeType.Folder) {
        throw new Error('Parent folder not found');
      }
    }

    return this.dbService.db.feedNodes.create({
      parentId: parentId,
      type: FeedNodeType.RSS,
      name: name,
      source: source,
      description: description ?? undefined,
      icon: icon ?? undefined,
      index: index,
      createdAt: Date.now(),
      id: feedId,
      unreadCount: 0,
    }).id;
  }

  removeFolder(folderId: string) {
    const info = this.dbService.db.feedNodes.get(folderId);
    if (info === null || info.type !== FeedNodeType.Folder) {
      throw new Error('Folder not found');
    }
    const stack = [info];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      if (current.type !== FeedNodeType.Folder) {
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
    if (feed === null || feed.type !== FeedNodeType.RSS) {
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
      if (parent === null || parent.type !== FeedNodeType.Folder) {
        throw new Error('Parent folder not found');
      }
    } else {
      if (node.type !== FeedNodeType.Folder && node.type !== FeedNodeType.RSS) {
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
