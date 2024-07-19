import { GraphQLService } from '@affine/core/modules/cloud';
import {
  DocsService,
  type Framework,
  WorkspaceLocalState,
  WorkspaceScope,
} from '@toeverything/infra';

import { SubscribeFeed } from './entities/subscribe-feed';
import { SubscriptionsService } from './services/subscriptions-service';
import { RecentPagesService } from './services/recent-pages';

export * from './entities/subscribe-feed';
export { SubscriptionsService, RecentPagesService };

export function configureNewFeedModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(SubscriptionsService)
    .service(RecentPagesService, [WorkspaceLocalState, DocsService])
    .entity(SubscribeFeed, [GraphQLService]);
}
