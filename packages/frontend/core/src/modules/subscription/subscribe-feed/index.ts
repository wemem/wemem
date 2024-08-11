import { GraphQLService } from '@affine/core/modules/cloud';
import {
  DocsService,
  type Framework,
  WorkspaceLocalState,
  WorkspaceScope,
} from '@toeverything/infra';

import { SubscribeFeed } from './entities/subscribe-feed';
import { RecentPagesService } from './services/recent-pages';
import { NewSubscriptionService } from './services/subscriptions-service';

export * from './entities/subscribe-feed';
export { RecentPagesService, NewSubscriptionService as SubscriptionsService };

export function configureSubscribeFeedModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(NewSubscriptionService)
    .service(RecentPagesService, [WorkspaceLocalState, DocsService])
    .entity(SubscribeFeed, [GraphQLService]);
}
