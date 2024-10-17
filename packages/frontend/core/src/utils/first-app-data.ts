import { DebugLogger } from '@affine/debug';
import { DEFAULT_WORKSPACE_NAME } from '@affine/env/constant';
import { WorkspaceFlavour } from '@affine/env/workspace';
import onboardingUrl from '@affine/templates/onboarding.zip';
import { ZipTransformer } from '@blocksuite/affine/blocks';
import type { WorkspacesService } from '@toeverything/infra';
import { DocsService } from '@toeverything/infra';

export async function buildShowcaseWorkspace(
  workspacesService: WorkspacesService,
  flavour: WorkspaceFlavour,
  workspaceName: string
) {
  const meta = await workspacesService.create(flavour, async docCollection => {
    docCollection.meta.initialize();
    docCollection.meta.setName(workspaceName);
    const blob = await (await fetch(onboardingUrl)).blob();

    await ZipTransformer.importDocs(docCollection, blob);
  });

  const { workspace, dispose } = workspacesService.open({ metadata: meta });

  await workspace.engine.waitForRootDocReady();

  const docsService = workspace.scope.get(DocsService);

  // should jump to "Write, Draw, Plan all at Once." in edgeless by default
  const defaultDoc = docsService.list.docs$.value.find(p =>
    p.title$.value.startsWith('Write, Draw, Plan all at Once.')
  );

  if (defaultDoc) {
    defaultDoc.setPrimaryMode('edgeless');
  }

  dispose();

  return { meta, defaultDocId: defaultDoc?.id };
}

const logger = new DebugLogger('createFirstAppData');

export async function createFirstAppData(workspacesService: WorkspacesService) {
  if (localStorage.getItem('is-first-open') !== null) {
    return;
  }
  localStorage.setItem('is-first-open', 'false');
  const { meta, defaultDocId } = await buildShowcaseWorkspace(
    workspacesService,
    WorkspaceFlavour.LOCAL,
    DEFAULT_WORKSPACE_NAME
  );
  logger.info('create first workspace', defaultDocId);
  return { meta, defaultPageId: defaultDocId };
}
