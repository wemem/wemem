import {
  type Framework,
  WorkspaceScope,
  WorkspaceService,
} from '@toeverything/infra';

import { FeedService } from './services/feed';

export function configureFeedModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(FeedService, [WorkspaceService]);
}
