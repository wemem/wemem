import type { useI18n } from '@affine/i18n';
import { ImportIcon, PlusIcon } from '@blocksuite/icons/rc';
import type { createStore } from 'jotai';

import { openCreateWorkspaceModalAtom } from '../atoms';
import type { usePageHelper } from '../components/blocksuite/block-suite-page-list/utils';
import { registerAffineCommand } from './registry';

export function registerAffineCreationCommands({
  store,
  pageHelper,
  t,
}: {
  t: ReturnType<typeof useI18n>;
  store: ReturnType<typeof createStore>;
  pageHelper: ReturnType<typeof usePageHelper>;
}) {
  const unsubs: Array<() => void> = [];
  unsubs.push(
    registerAffineCommand({
      id: 'affine:new-page',
      category: 'affine:creation',
      label: t['com.affine.cmdk.affine.new-page'](),
      icon: <PlusIcon />,
      keyBinding: environment.isDesktop
        ? {
            binding: '$mod+N',
            skipRegister: true,
          }
        : undefined,
      run() {
        pageHelper.createPage();
      },
    })
  );

  unsubs.push(
    registerAffineCommand({
      id: 'affine:new-edgeless-page',
      category: 'affine:creation',
      icon: <PlusIcon />,
      label: t['com.affine.cmdk.affine.new-edgeless-page'](),
      run() {
        pageHelper.createEdgeless();
      },
    })
  );

  unsubs.push(
    registerAffineCommand({
      id: 'affine:new-workspace',
      category: 'affine:creation',
      icon: <PlusIcon />,
      label: t['com.affine.cmdk.affine.new-workspace'](),
      run() {
        store.set(openCreateWorkspaceModalAtom, 'new');
      },
    })
  );
  unsubs.push(
    registerAffineCommand({
      id: 'affine:import-workspace',
      category: 'affine:creation',
      icon: <ImportIcon />,
      label: t['com.affine.cmdk.affine.import-workspace'](),
      preconditionStrategy: () => {
        return environment.isDesktop;
      },
      run() {
        store.set(openCreateWorkspaceModalAtom, 'add');
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
