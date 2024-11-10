import type { FeedNodeType } from './stores/feed-node';

export interface NodeInfo {
  id: string;
  parentId: string | null;
  type: FeedNodeType;
  data: string;
  index: string;
}

export enum ReadStatus {
  ALL = 'all',
  UNREAD = 'unread',
  READ = 'read',
}
