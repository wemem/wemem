import { toast } from '@affine/component';
import { FeedPageListHeader } from '@affine/core/components/page-list/docs/page-list-header-feed';
import { FeedDocsPageListHeader } from '@affine/core/components/page-list/docs/page-list-header-feed-docs';
import { useTrashModalHelper } from '@affine/core/hooks/affine/use-trash-modal-helper';
import { useBlockSuiteDocMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { CollectionService } from '@affine/core/modules/collection';
import type { Tag } from '@affine/core/modules/tag';
import type { Collection, Filter } from '@affine/env/filter';
import { Trans } from '@affine/i18n';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { DocMeta } from '@blocksuite/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { usePageHelper } from '../../blocksuite/block-suite-page-list/utils';
import { ListFloatingToolbar } from '../components/list-floating-toolbar';
import { usePageItemGroupDefinitions } from '../group-definitions';
import { usePageHeaderColsDef } from '../header-col-def';
import { PageOperationCell } from '../operation-cell';
import { PageListItemRenderer } from '../page-group';
import { ListTableHeader } from '../page-header';
import type { ItemListHandle, ListItem } from '../types';
import { useFilteredPageMetas } from '../use-filtered-page-metas';
import type { AllPageListConfig } from '../view/edit-collection/edit-collection';
import { VirtualizedList } from '../virtualized-list';
import {
  CollectionPageListHeader,
  PageListHeader,
  TagPageListHeader,
} from './page-list-header';

const usePageOperationsRenderer = () => {
  const t = useAFFiNEI18N();
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

export const VirtualizedPageList = ({
  tag,
  collection,
  feed,
  feedDocs,
  filters,
  config,
  listItem,
  setHideHeaderCreateNewPage,
  currentFilters,
  onChangeCurrentFilters,
}: {
  tag?: Tag;
  collection?: Collection;
  feed?: Collection;
  feedDocs?: boolean;
  filters?: Filter[];
  config?: AllPageListConfig;
  listItem?: DocMeta[];
  setHideHeaderCreateNewPage?: (hide: boolean) => void;
  emptyComponent?: ReactNode;
  currentFilters?: Filter[];
  onChangeCurrentFilters?: (filters: Filter[]) => void;
}) => {
  const listRef = useRef<ItemListHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const currentWorkspace = useService(WorkspaceService).workspace;
  const pageMetas = useBlockSuiteDocMeta(currentWorkspace.docCollection);
  const pageOperations = usePageOperationsRenderer();
  const { isPreferredEdgeless } = usePageHelper(currentWorkspace.docCollection);
  const pageHeaderColsDef = usePageHeaderColsDef();

  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    filters,
    collection,
  });
  const pageMetasToRender = useMemo(() => {
    if (listItem) {
      return listItem;
    }
    return filteredPageMetas;
  }, [filteredPageMetas, listItem]);

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
      const isInAllowList = collection?.allowList?.includes(page.id);
      return pageOperations(page, isInAllowList);
    },
    [collection, pageOperations]
  );

  const pageHeaderRenderer = useCallback(() => {
    return <ListTableHeader headerCols={pageHeaderColsDef} />;
  }, [pageHeaderColsDef]);

  const pageItemRenderer = useCallback((item: ListItem) => {
    return <PageListItemRenderer {...item} />;
  }, []);

  const heading = useMemo(() => {
    if (tag) {
      return <TagPageListHeader workspaceId={currentWorkspace.id} tag={tag} />;
    }
    if (collection && config) {
      return (
        <CollectionPageListHeader
          workspaceId={currentWorkspace.id}
          collection={collection}
          config={config}
        />
      );
    }
    if (feed) {
      return (
        <FeedPageListHeader
          workspaceId={currentWorkspace.id}
          collection={feed}
          propertiesMeta={currentWorkspace.docCollection.meta.properties}
          currentFilters={currentFilters!}
          onChangeCurrentFilters={onChangeCurrentFilters!}
        />
      );
    }
    if (feedDocs) {
      return (
        <FeedDocsPageListHeader
          workspaceId={currentWorkspace.id}
          propertiesMeta={currentWorkspace.docCollection.meta.properties}
          currentFilters={currentFilters!}
          onChangeCurrentFilters={onChangeCurrentFilters!}
        />
      );
    }
    return <PageListHeader currentFilters={currentFilters!}
                           onChangeCurrentFilters={onChangeCurrentFilters!}/>;
  }, [collection, config, currentWorkspace.docCollection.meta.properties, currentWorkspace.id, feed, feedDocs, tag]);

  const { setTrashModal } = useTrashModalHelper(currentWorkspace.docCollection);

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

  const group = usePageItemGroupDefinitions();

  return (
    <>
      <VirtualizedList
        ref={listRef}
        selectable="toggle"
        draggable
        atTopThreshold={80}
        atTopStateChange={setHideHeaderCreateNewPage}
        onSelectionActiveChange={setShowFloatingToolbar}
        heading={heading}
        groupBy={group}
        selectedIds={filteredSelectedPageIds}
        onSelectedIdsChange={setSelectedPageIds}
        items={pageMetasToRender}
        rowAsLink
        isPreferredEdgeless={isPreferredEdgeless}
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
