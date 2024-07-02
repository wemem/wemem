import { VirtualizedPageList } from '@affine/core/components/page-list';
import {
  FeedTag,
  SeenTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import { FilterContainer } from '@affine/core/pages/workspace/all-page/all-page-filter';
import type { Filter } from '@affine/env/filter';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ViewBodyIsland, ViewHeaderIsland } from '../../../modules/workbench';
import * as styles from './feed.css';
import { FeedDetailHeader } from './header';

export const UnseenFilter: Filter = {
  type: 'filter',
  left: {
    type: 'ref',
    name: 'Tags',
  },
  funcName: 'contains all',
  args: [
    {
      type: 'literal',
      value: [FeedTag.id, UnseenTag.id],
    },
  ],
};

const SeenFilter: Filter = {
  type: 'filter',
  left: {
    type: 'ref',
    name: 'Tags',
  },
  funcName: 'contains all',
  args: [
    {
      type: 'literal',
      value: [FeedTag.id, SeenTag.id],
    },
  ],
};

export const FeedDocsDetail = () => {
  const params = useParams();
  const filter = useMemo(() => {
    return params.status === 'true' ? SeenFilter : UnseenFilter;
  }, [params]);
  const [currentFilters, setCurrentFilters] = useState<Filter[]>([]);
  return (
    <>
      <ViewHeaderIsland>
        <FeedDetailHeader />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.body}>
          <FilterContainer
            filters={currentFilters}
            onChangeFilters={setCurrentFilters}
          />
          <VirtualizedPageList
            filters={[filter, ...currentFilters]}
            feedDocs={true}
            currentFilters={currentFilters}
            onChangeCurrentFilters={setCurrentFilters}
          />
        </div>
      </ViewBodyIsland>
    </>
  );
};

export const Component = function CollectionPage() {
  return <FeedDocsDetail />;
};
