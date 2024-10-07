import { DebugLogger } from '@affine/debug';
import { DocCollection } from '@blocksuite/store';

export { DocCollection };

export enum WorkspaceSubPath {
  ALL = 'all',
  TRASH = 'trash',
  SHARED = 'shared',
  Later = 'later',
  Archive = 'archive',
  Welcome = 'welcome',
}

export const WorkspaceSubPathName = {
  [WorkspaceSubPath.ALL]: 'All Pages',
  [WorkspaceSubPath.TRASH]: 'Trash',
  [WorkspaceSubPath.SHARED]: 'Shared',
  [WorkspaceSubPath.Later]: 'Later',
  [WorkspaceSubPath.Archive]: 'Archive',
  [WorkspaceSubPath.Welcome]: 'Welcome',
} satisfies {
  [Path in WorkspaceSubPath]: string;
};

export const pathGenerator = {
  all: workspaceId => `/workspace/${workspaceId}/all`,
  trash: workspaceId => `/workspace/${workspaceId}/trash`,
  shared: workspaceId => `/workspace/${workspaceId}/shared`,
  later: workspaceId => `/workspace/${workspaceId}/later`,
  archive: workspaceId => `/workspace/${workspaceId}/archive`,
  welcome: workspaceId => `/workspace/${workspaceId}/welcome`,
} satisfies {
  [Path in WorkspaceSubPath]: (workspaceId: string) => string;
};

export const performanceLogger = new DebugLogger('performance');
export const performanceRenderLogger = performanceLogger.namespace('render');
