import type { CollectionMeta } from '@affine/core/components/page-list';
import {
  CollectionListHeader,
  createEmptyCollection,
  useEditCollectionName,
  VirtualizedCollectionList,
} from '@affine/core/components/page-list';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { useCallback, useMemo, useState } from 'react';

import { CollectionService } from '../../../modules/collection';
import { ViewBodyIsland, ViewHeaderIsland } from '../../../modules/workbench';
import { EmptyCollectionList } from '../page-list-empty';
import { AllCollectionHeader } from './header';
import * as styles from './index.css';

export const AllCollection = () => {
  const t = useI18n();
  const currentWorkspace = useService(WorkspaceService).workspace;
  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);

  const collectionService = useService(CollectionService);
  const collections = useLiveData(collectionService.collections$);

  const collectionMetas = useMemo(() => {
    const collectionsList: CollectionMeta[] = collections.map(collection => {
      return {
        ...collection,
        title: collection.name,
      };
    });
    return collectionsList;
  }, [collections]);

  const navigateHelper = useNavigateHelper();
  const { open, node } = useEditCollectionName({
    title: t['com.affine.editCollection.createCollection'](),
    showTips: true,
  });

  const handleCreateCollection = useCallback(() => {
    open('')
      .then(name => {
        const id = nanoid();
        collectionService.addCollection(createEmptyCollection(id, { name }));
        navigateHelper.jumpToCollection(currentWorkspace.id, id);
      })
      .catch(err => {
        console.error(err);
      });
  }, [collectionService, currentWorkspace, navigateHelper, open]);

  return (
    <>
      <ViewHeaderIsland>
        <AllCollectionHeader
          showCreateNew={!hideHeaderCreateNew}
          onCreateCollection={handleCreateCollection}
        />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.body}>
          {collectionMetas.length > 0 ? (
            <VirtualizedCollectionList
              collections={collections}
              collectionMetas={collectionMetas}
              setHideHeaderCreateNewCollection={setHideHeaderCreateNew}
              node={node}
              handleCreateCollection={handleCreateCollection}
            />
          ) : (
            <EmptyCollectionList
              heading={
                <CollectionListHeader
                  node={node}
                  onCreate={handleCreateCollection}
                />
              }
            />
          )}
        </div>
      </ViewBodyIsland>
    </>
  );
};

export const Component = () => {
  return <AllCollection />;
};
