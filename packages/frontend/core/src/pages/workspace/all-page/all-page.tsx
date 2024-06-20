import {
  PageListHeader,
  useFilteredPageMetas,
  VirtualizedPageList,
} from '@affine/core/components/page-list';
import { useBlockSuiteDocMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { performanceRenderLogger } from '@affine/core/shared';
import type { Filter } from '@affine/env/filter';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useState } from 'react';

import { ViewBodyIsland, ViewHeaderIsland } from '../../../modules/workbench';
import { EmptyPageList } from '../page-list-empty';
import * as styles from './all-page.css';
import { FilterContainer } from './all-page-filter';
import { AllPageHeader } from './all-page-header';

export const AllPage = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const pageMetas = useBlockSuiteDocMeta(currentWorkspace.docCollection);
  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);

  const [filters, setFilters] = useState<Filter[]>([]);
  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    filters: filters,
  });

  return (
    <>
      <ViewHeaderIsland>
        <AllPageHeader
          showCreateNew={!hideHeaderCreateNew}
          filters={filters}
          onChangeFilters={setFilters}
        />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.body}>
          <FilterContainer filters={filters} onChangeFilters={setFilters} />
          {filteredPageMetas.length > 0 ? (
            <VirtualizedPageList
              setHideHeaderCreateNewPage={setHideHeaderCreateNew}
              filters={filters}
              currentFilters={filters}
              onChangeCurrentFilters={setFilters}
            />
          ) : (
            <EmptyPageList
              type="all"
              heading={<PageListHeader currentFilters={filters} onChangeCurrentFilters={setFilters} />}
              docCollection={currentWorkspace.docCollection}
            />
          )}
        </div>
      </ViewBodyIsland>
    </>
  );
};

export const Component = () => {
  performanceRenderLogger.info('AllPage');

  return <AllPage />;
};
