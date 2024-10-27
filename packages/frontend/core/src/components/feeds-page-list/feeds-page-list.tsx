import { toast } from '@affine/component';
import { CollectionService } from '@affine/core/modules/collection';
import { ReadStatus } from '@affine/core/modules/feeds';
import type { Filter } from '@affine/env/filter';
import { Trans, useI18n } from '@affine/i18n';
import type { DocMeta } from '@blocksuite/affine/store';
import { DocsService, useService, WorkspaceService } from '@toeverything/infra';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useTrashModalHelper } from '../hooks/affine/use-trash-modal-helper';
import {
  ListTableHeader,
  useFilteredPageMetas,
  VirtualizedList,
} from '../page-list';
import { usePageHeaderColsDef } from './feeds-header-col-def';
import { useFeedsPageItemGroupDefinitions } from './feeds-hooks';
import { PageOperationCell } from './feeds-operation-cell';
import { PageListItemRenderer } from './feeds-page-group';
import { ListFloatingToolbar } from './feeds-page-list-floating-toolbar';
import { FeedsDocsPageListHeader } from './feeds-page-list-header';
import type { ItemListHandle, ListItem } from './types';

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
  pageMetas,
  readStatus,
  filters,
  currentFilters,
  onChangeCurrentFilters,
  wrapTo,
}: {
  pageMetas: DocMeta[];
  readStatus: ReadStatus;
  filters?: Filter[];
  currentFilters?: Filter[];
  onChangeCurrentFilters?: (filters: Filter[]) => void;
  wrapTo: (to: string) => string;
}) => {
  const listRef = useRef<ItemListHandle>(null);
  const docRecordList = useService(DocsService).list;
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const currentWorkspace = useService(WorkspaceService).workspace;
  const pageOperations = usePageOperationsRenderer();
  const pageHeaderColsDef = usePageHeaderColsDef();
  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    filters,
  });

  const filteredSelectedPageIds = useMemo(() => {
    const ids = pageMetas.map(page => page.id);
    return selectedPageIds.filter(id => ids.includes(id));
  }, [pageMetas, selectedPageIds]);

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
    return <PageListItemRenderer item={item} />;
  }, []);

  const heading = useMemo(() => {
    return (
      <FeedsDocsPageListHeader
        filteredPageMetas={filteredPageMetas}
        workspaceId={currentWorkspace.id}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        currentFilters={currentFilters!}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        onChangeCurrentFilters={onChangeCurrentFilters!}
      />
    );
  }, [
    currentFilters,
    currentWorkspace.id,
    filteredPageMetas,
    onChangeCurrentFilters,
  ]);

  const handleMultiMarkReadStatus = useCallback(() => {
    if (filteredSelectedPageIds.length === 0) {
      return;
    }
    filteredSelectedPageIds.forEach(id => {
      const docRecord = docRecordList.doc$(id).value;
      docRecord && docRecord.toggleRead();
    });

    hideFloatingToolbar();
  }, [docRecordList, filteredSelectedPageIds, hideFloatingToolbar]);

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
        items={pageMetas}
        rowAsLink
        wrapTo={wrapTo}
        docCollection={currentWorkspace.docCollection}
        operationsRenderer={pageOperationRenderer}
        itemRenderer={pageItemRenderer}
        headerRenderer={pageHeaderRenderer}
      />
      <ListFloatingToolbar
        open={showFloatingToolbar}
        onMarkAsRead={
          [ReadStatus.UNREAD, ReadStatus.ALL].includes(readStatus)
            ? () => handleMultiMarkReadStatus()
            : undefined
        }
        onMarkAsUnread={
          readStatus === ReadStatus.READ
            ? () => handleMultiMarkReadStatus()
            : undefined
        }
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
