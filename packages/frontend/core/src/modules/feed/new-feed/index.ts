import { GraphQLService } from '@affine/core/modules/cloud';
import {
  DocsService,
  type Framework,
  WorkspaceLocalState,
  WorkspaceScope,
} from '@toeverything/infra';

import { NewFeed } from './entities/new-feed';
import { NewFeedService } from './services/new-feed-search';
import { RecentPagesService } from './services/recent-pages';

export * from './entities/new-feed';
export { NewFeedService, RecentPagesService };

export function configureNewFeedModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(NewFeedService)
    .service(RecentPagesService, [WorkspaceLocalState, DocsService])
    .entity(NewFeed, [GraphQLService]);
}
