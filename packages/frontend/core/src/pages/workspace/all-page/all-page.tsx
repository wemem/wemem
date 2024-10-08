import {
  PageListHeader,
  useFilteredPageMetas,
  VirtualizedPageList,
} from '@affine/core/components/page-list';
import { useBlockSuiteDocMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { FeedTag } from '@affine/core/modules/tag/entities/internal-tag';
import { performanceRenderLogger } from '@affine/core/shared';
import type { Filter } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import {
  GlobalContextService,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { useMemo, useEffect, useState } from 'react';

import {
  useIsActiveView,
  ViewBody,
  ViewHeader,
  ViewIcon,
  ViewTitle,
} from '../../../modules/workbench';
import { EmptyPageList } from '../page-list-empty';
import * as styles from './all-page.css';
import { FilterContainer } from './all-page-filter';
import { AllPageHeader } from './all-page-header';

const FeedFilter: Filter = {
  type: 'filter',
  left: {
    type: 'ref',
    name: 'Tags',
  },
  funcName: 'does not contains all',
  args: [
    {
      type: 'literal',
      value: [FeedTag.id],
    },
  ],
};

export const AllPage = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const globalContext = useService(GlobalContextService).globalContext;
  const pageMetas = useBlockSuiteDocMeta(currentWorkspace.docCollection);
  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);

  const [filters, setFilters] = useState<Filter[]>([]);
  const mergedFilters = useMemo(() => {
    return [...filters, FeedFilter];
  }, [filters]);
  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    filters: mergedFilters,
  });

  const isActiveView = useIsActiveView();

  useEffect(() => {
    if (isActiveView) {
      globalContext.isAllDocs.set(true);

      return () => {
        globalContext.isAllDocs.set(false);
      };
    }
    return;
  }, [globalContext, isActiveView]);

  const t = useI18n();

  return (
    <>
      <ViewTitle title={t['All pages']()} />
      <ViewIcon icon="allDocs" />
      <ViewHeader>
        <AllPageHeader
          showCreateNew={!hideHeaderCreateNew}
          filters={filters}
          onChangeFilters={setFilters}
        />
      </ViewHeader>
      <ViewBody>
        <div className={styles.body}>
          <FilterContainer filters={filters} onChangeFilters={setFilters} />
          {filteredPageMetas.length > 0 ? (
            <VirtualizedPageList
              setHideHeaderCreateNewPage={setHideHeaderCreateNew}
              filters={mergedFilters}
              currentFilters={filters}
              onChangeCurrentFilters={setFilters}
            />
          ) : (
            <EmptyPageList
              type="all"
              heading={<PageListHeader />}
              docCollection={currentWorkspace.docCollection}
            />
          )}
        </div>
      </ViewBody>
    </>
  );
};

export const Component = () => {
  performanceRenderLogger.debug('AllPage');

  return <AllPage />;
};
