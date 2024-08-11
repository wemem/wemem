import { toast, useConfirmModal } from '@affine/component';
import { useBlockSuiteMetaHelper } from '@affine/core/hooks/affine/use-block-suite-meta-helper';
import { useBlockSuiteDocMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { Trans, useI18n } from '@affine/i18n';
import type { DocMeta } from '@blocksuite/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useCallback, useMemo, useRef, useState } from 'react';

import { usePageHelper } from '../blocksuite/block-suite-page-list/utils';
import { ListFloatingToolbar } from './components/list-floating-toolbar';
import { usePageHeaderColsDef } from './header-col-def';
import { TrashOperationCell } from './operation-cell';
import { PageListItemRenderer } from './page-group';
import { ListTableHeader } from './page-header';
import type { ItemListHandle, ListItem } from './types';
import { useFilteredPageMetas } from './use-filtered-page-metas';
import { VirtualizedList } from './virtualized-list';

export const VirtualizedTrashList = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const docCollection = currentWorkspace.docCollection;
  const { restoreFromTrash, permanentlyDeletePage } =
    useBlockSuiteMetaHelper(docCollection);
  const pageMetas = useBlockSuiteDocMeta(docCollection);
  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    trash: true,
  });

  const { isPreferredEdgeless } = usePageHelper(docCollection);

  const listRef = useRef<ItemListHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);

  const { openConfirmModal } = useConfirmModal();
  const t = useI18n();
  const pageHeaderColsDef = usePageHeaderColsDef();

  const filteredSelectedPageIds = useMemo(() => {
    const ids = filteredPageMetas.map(page => page.id);
    return selectedPageIds.filter(id => ids.includes(id));
  }, [filteredPageMetas, selectedPageIds]);

  const hideFloatingToolbar = useCallback(() => {
    listRef.current?.toggleSelectable();
  }, []);

  const handleMultiDelete = useCallback(() => {
    filteredSelectedPageIds.forEach(pageId => {
      permanentlyDeletePage(pageId);
    });
    hideFloatingToolbar();
    toast(t['com.affine.toastMessage.permanentlyDeleted']());
  }, [filteredSelectedPageIds, hideFloatingToolbar, permanentlyDeletePage, t]);

  const handleMultiRestore = useCallback(() => {
    filteredSelectedPageIds.forEach(pageId => {
      restoreFromTrash(pageId);
    });
    hideFloatingToolbar();
    toast(
      t['com.affine.toastMessage.restored']({
        title: filteredSelectedPageIds.length > 1 ? 'docs' : 'doc',
      })
    );
  }, [filteredSelectedPageIds, hideFloatingToolbar, restoreFromTrash, t]);

  const onConfirmPermanentlyDelete = useCallback(() => {
    if (filteredSelectedPageIds.length === 0) {
      return;
    }
    openConfirmModal({
      title: `${t['com.affine.trashOperation.deletePermanently']()}?`,
      description: t['com.affine.trashOperation.deleteDescription'](),
      cancelText: t['Cancel'](),
      confirmText: t['com.affine.trashOperation.delete'](),
      confirmButtonOptions: {
        variant: 'error',
      },
      onConfirm: handleMultiDelete,
    });
  }, [filteredSelectedPageIds.length, handleMultiDelete, openConfirmModal, t]);

  const pageOperationsRenderer = useCallback(
    (item: ListItem) => {
      const page = item as DocMeta;
      const onRestorePage = () => {
        restoreFromTrash(page.id);
        toast(
          t['com.affine.toastMessage.restored']({
            title: page.title || 'Untitled',
          })
        );
      };
      const onPermanentlyDeletePage = () => {
        permanentlyDeletePage(page.id);
        toast(t['com.affine.toastMessage.permanentlyDeleted']());
      };

      return (
        <TrashOperationCell
          onPermanentlyDeletePage={onPermanentlyDeletePage}
          onRestorePage={onRestorePage}
        />
      );
    },

    [permanentlyDeletePage, restoreFromTrash, t]
  );
  const pageItemRenderer = useCallback((item: ListItem) => {
    return <PageListItemRenderer {...item} />;
  }, []);
  const pageHeaderRenderer = useCallback(() => {
    return <ListTableHeader headerCols={pageHeaderColsDef} />;
  }, [pageHeaderColsDef]);

  return (
    <>
      <VirtualizedList
        ref={listRef}
        selectable="toggle"
        items={filteredPageMetas}
        rowAsLink
        isPreferredEdgeless={isPreferredEdgeless}
        onSelectionActiveChange={setShowFloatingToolbar}
        docCollection={currentWorkspace.docCollection}
        operationsRenderer={pageOperationsRenderer}
        itemRenderer={pageItemRenderer}
        headerRenderer={pageHeaderRenderer}
        selectedIds={filteredSelectedPageIds}
        onSelectedIdsChange={setSelectedPageIds}
      />
      <ListFloatingToolbar
        open={showFloatingToolbar}
        onDelete={onConfirmPermanentlyDelete}
        onClose={hideFloatingToolbar}
        onRestore={handleMultiRestore}
        content={
          <Trans
            i18nKey="com.affine.page.toolbar.selected"
            count={filteredSelectedPageIds.length}
          >
            <div style={{ color: 'var(--affine-text-secondary-color)' }}>
              {{ count: filteredSelectedPageIds.length } as any}
            </div>
            selected
          </Trans>
        }
      />
    </>
  );
};
