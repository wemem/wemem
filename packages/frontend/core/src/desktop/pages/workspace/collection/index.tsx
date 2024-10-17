import { notify } from '@affine/component';
import { EmptyCollectionDetail } from '@affine/core/components/affine/empty/collection-detail';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import {
  useEditCollection,
  VirtualizedPageList,
} from '@affine/core/components/page-list';
import { CollectionService } from '@affine/core/modules/collection';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { ViewLayersIcon } from '@blocksuite/icons/rc';
import {
  GlobalContextService,
  useLiveData,
  useService,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useNavigateHelper } from '../../../../components/hooks/use-navigate-helper';
import {
  useIsActiveView,
  ViewBody,
  ViewHeader,
  ViewIcon,
  ViewTitle,
} from '../../../../modules/workbench';
import { CollectionDetailHeader } from './header';

export const CollectionDetail = ({
  collection,
}: {
  collection: Collection;
}) => {
  const { open } = useEditCollection();
  const collectionService = useService(CollectionService);
  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);

  const handleEditCollection = useAsyncCallback(async () => {
    const ret = await open({ ...collection }, 'page');
    collectionService.updateCollection(ret.id, () => ret);
  }, [collection, collectionService, open]);

  return (
    <>
      <ViewHeader>
        <CollectionDetailHeader
          showCreateNew={!hideHeaderCreateNew}
          onCreate={handleEditCollection}
        />
      </ViewHeader>
      <ViewBody>
        <VirtualizedPageList
          collection={collection}
          setHideHeaderCreateNewPage={setHideHeaderCreateNew}
        />
      </ViewBody>
    </>
  );
};

export const Component = function CollectionPage() {
  const { collectionService, globalContextService } = useServices({
    CollectionService,
    GlobalContextService,
  });
  const globalContext = globalContextService.globalContext;

  const collections = useLiveData(collectionService.collections$);
  const navigate = useNavigateHelper();
  const params = useParams();
  const workspace = useService(WorkspaceService).workspace;
  const collection = collections.find(v => v.id === params.collectionId);
  const isActiveView = useIsActiveView();

  const notifyCollectionDeleted = useCallback(() => {
    navigate.jumpToPage(workspace.id, 'all');
    const collection = collectionService.collectionsTrash$.value.find(
      v => v.collection.id === params.collectionId
    );
    let text = 'Collection does not exist';
    if (collection) {
      if (collection.userId) {
        text = `${collection.collection.name} has been deleted by ${collection.userName}`;
      } else {
        text = `${collection.collection.name} has been deleted`;
      }
    }
    return notify.error({ title: text });
  }, [collectionService, navigate, params.collectionId, workspace.id]);

  useEffect(() => {
    if (isActiveView && collection) {
      globalContext.collectionId.set(collection.id);
      globalContext.isCollection.set(true);

      return () => {
        globalContext.collectionId.set(null);
        globalContext.isCollection.set(false);
      };
    }
    return;
  }, [collection, globalContext, isActiveView]);

  useEffect(() => {
    if (!collection) {
      notifyCollectionDeleted();
    }
  }, [collection, notifyCollectionDeleted]);

  if (!collection) {
    return null;
  }
  const inner = isEmptyCollection(collection) ? (
    <Placeholder collection={collection} />
  ) : (
    <CollectionDetail collection={collection} />
  );

  return (
    <>
      <ViewIcon icon="collection" />
      <ViewTitle title={collection.name} />
      {inner}
    </>
  );
};

const Placeholder = ({ collection }: { collection: Collection }) => {
  const workspace = useService(WorkspaceService).workspace;
  const { jumpToCollections } = useNavigateHelper();
  const t = useI18n();

  const handleJumpToCollections = useCallback(() => {
    jumpToCollections(workspace.id);
  }, [jumpToCollections, workspace]);

  return (
    <>
      <ViewHeader>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 'var(--affine-font-xs)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              color: 'var(--affine-text-secondary-color)',
              ['WebkitAppRegion' as string]: 'no-drag',
            }}
            onClick={handleJumpToCollections}
          >
            <ViewLayersIcon
              style={{ color: 'var(--affine-icon-color)' }}
              fontSize={14}
            />
            {t['com.affine.collection.allCollections']()}
            <div>/</div>
          </div>
          <div
            data-testid="collection-name"
            style={{
              fontWeight: 600,
              color: 'var(--affine-text-primary-color)',
              ['WebkitAppRegion' as string]: 'no-drag',
            }}
          >
            {collection.name}
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </ViewHeader>
      <ViewBody>
        <EmptyCollectionDetail
          collection={collection}
          style={{ height: '100%' }}
        />
      </ViewBody>
    </>
  );
};

export const isEmptyCollection = (collection: Collection) => {
  return (
    collection.allowList.length === 0 && collection.filterList.length === 0
  );
};
