import { useDeleteFeed } from '@affine/core/components/page-list';
import { useDeleteCollectionInfo } from '@affine/core/hooks/affine/use-delete-collection-info';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import type { Collection } from '@affine/env/filter';
import { Trans } from '@affine/i18n';
import { useService, WorkspaceService } from '@toeverything/infra';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ListFloatingToolbar } from '../components/list-floating-toolbar';
import { feedHeaderColsDef } from '../header-col-def-feed';
import { FeedOperationCell } from '../operation-cell-feed';
import { FeedListItemRenderer } from '../page-group-feed';
import { ListTableHeader } from '../page-header';
import type { CollectionMeta, ItemListHandle, ListItem } from '../types';
import { VirtualizedList } from '../virtualized-list';
import { FeedListHeader } from './feed-list-header';

const useFeedOperationsRenderer = () => {
  return useCallback(
    (collection: Collection) => {
      return (
        <FeedOperationCell
          collection={collection}
        />
      );
    },
    [],
  );
};

export const VirtualizedFeedList = ({
                                      collections,
                                      collectionMetas,
                                      setHideHeaderCreateNewFeed,
                                      node,
                                      handleCreateFeed,
                                    }: {
  collections: Collection[];
  collectionMetas: CollectionMeta[];
  node: ReactElement | null;
  handleCreateFeed: () => void;
  setHideHeaderCreateNewFeed: (hide: boolean) => void;
}) => {
  const listRef = useRef<ItemListHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    [],
  );
  const feedService = useService(FeedService);
  const currentWorkspace = useService(WorkspaceService).workspace;
  const info = useDeleteCollectionInfo();
  const deleteFeed = useDeleteFeed();
  const feedOperations = useFeedOperationsRenderer();

  const filteredSelectedCollectionIds = useMemo(() => {
    const ids = collections.map(collection => collection.id);
    return selectedCollectionIds.filter(id => ids.includes(id));
  }, [collections, selectedCollectionIds]);

  const hideFloatingToolbar = useCallback(() => {
    listRef.current?.toggleSelectable();
  }, []);

  const feedOperationRenderer = useCallback(
    (item: ListItem) => {
      const collection = item as CollectionMeta;
      return feedOperations(collection);
    },
    [feedOperations],
  );

  const feedHeaderRenderer = useCallback(() => {
    return <ListTableHeader headerCols={feedHeaderColsDef} />;
  }, []);

  const feedItemRenderer = useCallback((item: ListItem) => {
    return <FeedListItemRenderer {...item} />;
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedCollectionIds.length === 0) {
      return;
    }
    deleteFeed(...selectedCollectionIds);
    hideFloatingToolbar();
  }, [feedService, hideFloatingToolbar, info, selectedCollectionIds]);

  return (
    <>
      <VirtualizedList
        ref={listRef}
        selectable="toggle"
        draggable
        atTopThreshold={80}
        atTopStateChange={setHideHeaderCreateNewFeed}
        onSelectionActiveChange={setShowFloatingToolbar}
        heading={
          <FeedListHeader node={node} onCreate={handleCreateFeed} />
        }
        selectedIds={filteredSelectedCollectionIds}
        onSelectedIdsChange={setSelectedCollectionIds}
        items={collectionMetas}
        itemRenderer={feedItemRenderer}
        rowAsLink
        docCollection={currentWorkspace.docCollection}
        operationsRenderer={feedOperationRenderer}
        headerRenderer={feedHeaderRenderer}
      />
      <ListFloatingToolbar
        open={showFloatingToolbar}
        content={
          <Trans
            i18nKey="ai.readflow.feed.toolbar.selected"
            count={selectedCollectionIds.length}
          >
            <div style={{ color: 'var(--affine-text-secondary-color)' }}>
              {{ count: selectedCollectionIds.length } as any}
            </div>
            selected
          </Trans>
        }
        onClose={hideFloatingToolbar}
        onDelete={handleDelete}
      />
    </>
  );
};
