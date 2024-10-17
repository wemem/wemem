import { toast } from '@affine/component';
import { CollectionService } from '@affine/core/modules/collection';
import type { Filter } from '@affine/env/filter';
import { Trans, useI18n } from '@affine/i18n';
import type { DocMeta } from '@blocksuite/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useTrashModalHelper } from '../../hooks/affine/use-trash-modal-helper';
import { useBlockSuiteDocMeta } from '../../hooks/use-block-suite-page-meta';
import { ListFloatingToolbar } from '../components/list-floating-toolbar';
import { ListTableHeader } from '../page-header';
import type { ItemListHandle, ListItem } from '../types';
import { useFilteredPageMetas } from '../use-filtered-page-metas';
import { VirtualizedList } from '../virtualized-list';
import { usePageHeaderColsDef } from './feeds-header-col-def';
import { useFeedsPageItemGroupDefinitions } from './feeds-hooks';
import { PageOperationCell } from './feeds-operation-cell';
import { PageListItemRenderer } from './feeds-page-group';
import { FeedsDocsPageListHeader } from './feeds-page-list-header-feed-docs';

const usePageOperationsRenderer = () => {
  const t = useI18n();
  const collectionService = useService(CollectionService);
  const removeFromAllowList = useCallback(
    (id: string) => {
      collectionService.deletePagesFromCollections([id]);
      toast(t['com.affine.collection.removePage.success']());
    },
    [collectionService, t]
  );
  const pageOperationsRenderer = useCallback(
    (page: DocMeta, isInAllowList?: boolean) => {
      return (
        <PageOperationCell
          page={page}
          isInAllowList={isInAllowList}
          onRemoveFromAllowList={() => removeFromAllowList(page.id)}
        />
      );
    },
    [removeFromAllowList]
  );
  return pageOperationsRenderer;
};

export const FeedsPageList = ({
  filters,
  currentFilters,
  onChangeCurrentFilters,
  wrapTo,
}: {
  filters?: Filter[];
  currentFilters?: Filter[];
  onChangeCurrentFilters?: (filters: Filter[]) => void;
  wrapTo?: (to: string) => string;
}) => {
  const listRef = useRef<ItemListHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const currentWorkspace = useService(WorkspaceService).workspace;
  const pageMetas = useBlockSuiteDocMeta(currentWorkspace.docCollection);
  const pageOperations = usePageOperationsRenderer();
  const pageHeaderColsDef = usePageHeaderColsDef();
  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    filters,
  });
  const pageMetasToRender = useMemo(() => {
    return filteredPageMetas;
  }, [filteredPageMetas]);

  const filteredSelectedPageIds = useMemo(() => {
    const ids = pageMetasToRender.map(page => page.id);
    return selectedPageIds.filter(id => ids.includes(id));
  }, [pageMetasToRender, selectedPageIds]);

  const hideFloatingToolbar = useCallback(() => {
    listRef.current?.toggleSelectable();
  }, []);

  const pageOperationRenderer = useCallback(
    (item: ListItem) => {
      const page = item as DocMeta;
      return pageOperations(page);
    },
    [pageOperations]
  );

  const pageHeaderRenderer = useCallback(() => {
    return <ListTableHeader headerCols={pageHeaderColsDef} />;
  }, [pageHeaderColsDef]);

  const pageItemRenderer = useCallback((item: ListItem) => {
    return <PageListItemRenderer {...item} />;
  }, []);

  const heading = useMemo(() => {
    return (
      <FeedsDocsPageListHeader
        filteredPageMetas={filteredPageMetas}
        workspaceId={currentWorkspace.id}
        docCollection={currentWorkspace.docCollection}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        currentFilters={currentFilters!}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        onChangeCurrentFilters={onChangeCurrentFilters!}
      />
    );
  }, [
    currentFilters,
    currentWorkspace.docCollection,
    currentWorkspace.id,
    filteredPageMetas,
    onChangeCurrentFilters,
  ]);

  const { setTrashModal } = useTrashModalHelper();

  const handleMultiDelete = useCallback(() => {
    if (filteredSelectedPageIds.length === 0) {
      return;
    }
    const pageNameMapping = Object.fromEntries(
      pageMetas.map(meta => [meta.id, meta.title])
    );

    const pageNames = filteredSelectedPageIds.map(
      id => pageNameMapping[id] ?? ''
    );
    setTrashModal({
      open: true,
      pageIds: filteredSelectedPageIds,
      pageTitles: pageNames,
    });
    hideFloatingToolbar();
  }, [filteredSelectedPageIds, hideFloatingToolbar, pageMetas, setTrashModal]);

  const group = useFeedsPageItemGroupDefinitions();

  return (
    <>
      <VirtualizedList
        ref={listRef}
        selectable="toggle"
        draggable
        atTopThreshold={80}
        onSelectionActiveChange={setShowFloatingToolbar}
        heading={heading}
        groupBy={group}
        selectedIds={filteredSelectedPageIds}
        onSelectedIdsChange={setSelectedPageIds}
        items={pageMetasToRender}
        rowAsLink
        wrapTo={wrapTo}
        docCollection={currentWorkspace.docCollection}
        operationsRenderer={pageOperationRenderer}
        itemRenderer={pageItemRenderer}
        headerRenderer={pageHeaderRenderer}
      />
      <ListFloatingToolbar
        open={showFloatingToolbar}
        onDelete={handleMultiDelete}
        onClose={hideFloatingToolbar}
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
