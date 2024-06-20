import type { Filter } from '@affine/env/filter';
import { useService, WorkspaceService } from '@toeverything/infra';

import { filterContainerStyle } from '../../../components/filter-container.css';
import {
  FilterList,
} from '../../../components/page-list';

export const FilterContainer = ({
                                  filters,
                                  onChangeFilters,
                                }: {
  filters: Filter[];
  onChangeFilters: (filters: Filter[]) => void;
}) => {
  const currentWorkspace = useService(WorkspaceService).workspace;

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
    </div>
  );
};
