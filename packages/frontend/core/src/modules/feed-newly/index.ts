import { GraphQLService } from '@affine/core/modules/cloud';
import {
  DocsService,
  type Framework,
  WorkspaceLocalState,
  WorkspaceScope,
} from '@toeverything/infra';

import { SubscribeFeed } from './entities/subscribe-feed';
import { NewFeedService } from './services/new-feed-service';
import { RecentPagesService } from './services/recent-pages';

export * from './entities/subscribe-feed';
export { NewFeedService, RecentPagesService };

export function configureSubscribeFeedModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(NewFeedService)
    .service(RecentPagesService, [WorkspaceLocalState, DocsService])
    .entity(SubscribeFeed, [GraphQLService]);
}
