import { GraphQLService } from '@affine/core/modules/cloud';
import {
  type Framework,
  WorkspaceDBService,
  WorkspaceScope,
  WorkspaceService,
} from '@toeverything/infra';

import { FeedInfoModal } from './entities/feed-info-modal';
import { FeedNode } from './entities/feed-node';
import { FeedSearchModal } from './entities/feed-search-modal';
import { FeedTree } from './entities/feed-tree';
import { FeedsService } from './services/feeds';
import { FeedNodesStore } from './stores/feed-node';

export { FeedInfoModal } from './entities/feed-info-modal';
export { FeedNode } from './entities/feed-node';
export { FeedSearchModal } from './entities/feed-search-modal';
export { useCleanDuplicateOnDocRemove } from './hooks/use-clean-duplicate-on-doc-remove';
export { FeedsService } from './services/feeds';
export * from './stores/feed-node';
export * from './types';

export function configureFeedsModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(FeedsService, [WorkspaceService])
    .entity(FeedTree, [FeedNodesStore])
    .entity(FeedNode, [FeedNodesStore, GraphQLService, WorkspaceService])
    .entity(FeedInfoModal)
    .entity(FeedSearchModal, [GraphQLService])
    .store(FeedNodesStore, [WorkspaceDBService]);
}
