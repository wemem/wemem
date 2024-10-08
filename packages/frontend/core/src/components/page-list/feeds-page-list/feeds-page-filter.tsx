import { CollectionService } from '@affine/core/modules/collection';
import type { Collection, Filter } from '@affine/env/filter';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useCallback } from 'react';

import {
  FilterList,
  SaveAsCollectionButton,
} from '../../../components/page-list';
import { useNavigateHelper } from '../../../hooks/use-navigate-helper';
import { filterContainerStyle } from './feeds-page-filter.css';

export const FeedsFilterContainer = ({
  filters,
  onChangeFilters,
}: {
  filters: Filter[];
  onChangeFilters: (filters: Filter[]) => void;
}) => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const navigateHelper = useNavigateHelper();
  const collectionService = useService(CollectionService);
  const saveToCollection = useCallback(
    (collection: Collection) => {
      collectionService.addCollection({
        ...collection,
        filterList: filters,
      });
      navigateHelper.jumpToCollection(currentWorkspace.id, collection.id);
    },
    [collectionService, filters, navigateHelper, currentWorkspace.id]
  );

  if (!filters.length) {
    return null;
  }

  return (
    <div className={filterContainerStyle}>
      <div style={{ flex: 1 }}>
        <FilterList
          propertiesMeta={currentWorkspace.docCollection.meta.properties}
          value={filters}
          onChange={onChangeFilters}
        />
      </div>
      <div>
        {/* 暂时关闭这个功能，因为订阅流程的数据是变化，暂时还没想好怎么做比较好，现在的思路是应该不会使用精选，而是创建一个自己的订阅分组，和其他RSS平级，放在订阅下面，别人也可以订阅 */}
        {/* eslint-disable-next-line no-constant-condition  */}
        {filters.length > 0 && false ? (
          <SaveAsCollectionButton onConfirm={saveToCollection} />
        ) : null}
      </div>
    </div>
  );
};
