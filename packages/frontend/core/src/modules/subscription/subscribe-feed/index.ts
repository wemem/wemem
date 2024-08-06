import { GraphQLService } from '@affine/core/modules/cloud';
import {
  DocsService,
  type Framework,
  WorkspaceLocalState,
  WorkspaceScope,
} from '@toeverything/infra';

import { SubscribeFeed } from './entities/subscribe-feed';
import { RecentPagesService } from './services/recent-pages';
import { SubscriptionsService } from './services/subscriptions-service';

export * from './entities/subscribe-feed';
export { RecentPagesService, SubscriptionsService };

export function configureSubscribeFeedModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(SubscriptionsService)
    .service(RecentPagesService, [WorkspaceLocalState, DocsService])
    .entity(SubscribeFeed, [GraphQLService]);
}
