export * from './entities/internal-tag';
export { Tag } from './entities/tag';
export { tagColorMap } from './entities/utils';
export { TagService } from './service/tag';
export { DeleteTagConfirmModal } from './view/delete-tag-modal';

import {
  DocsService,
  type Framework,
  WorkspaceScope,
} from '@toeverything/infra';

import { WorkspaceLegacyProperties } from '../properties';
import { Tag } from './entities/tag';
import { TagList } from './entities/tag-list';
import { TagService } from './service/tag';
import { TagStore } from './stores/tag';

export function configureTagModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(TagService)
    .store(TagStore, [WorkspaceLegacyProperties])
    .entity(TagList, [TagStore, DocsService])
    .entity(Tag, [TagStore, DocsService]);
}
