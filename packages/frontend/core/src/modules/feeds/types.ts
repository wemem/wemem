export interface NodeInfo {
  id: string;
  parentId: string | null;
  type: 'feedFolder' | 'doc' | 'tag' | 'collection';
  data: string;
  index: string;
}

export enum ReadStatus {
  ALL = 'all',
  UNREAD = 'unread',
  READ = 'read',
}
