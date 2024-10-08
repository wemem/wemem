import {
  type Framework,
  WorkspaceScope,
  WorkspaceService,
} from '@toeverything/infra';

import { FeedsService } from './services/feeds-service';

export function configureFeedModule(framework: Framework) {
  framework.scope(WorkspaceScope).service(FeedsService, [WorkspaceService]);
}
