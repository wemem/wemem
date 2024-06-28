import { type Framework, WorkspaceScope } from '@toeverything/infra';

import { WorkbenchService } from '../workbench';
import { PeekViewEntity } from './entities/peek-view';
import { PeekViewService } from './services/peek-view';

export function configurePeekViewModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(PeekViewService)
    .entity(PeekViewEntity, [WorkbenchService]);
}

export { PeekViewEntity, PeekViewService };
export { PeekViewManagerModal, useInsidePeekView } from './view';
