import {
  type Framework,
  WorkspaceScope,
  WorkspaceService,
} from '@toeverything/infra';

import { SubscriptionService } from './services/subscription-service';

export function configureFeedModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(SubscriptionService, [WorkspaceService]);
}
