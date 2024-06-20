import { ListHeaderTitleCell } from '@affine/core/components/page-list/page-header';

import type { HeaderColDef } from './types';

export const feedHeaderColsDef: HeaderColDef[] = [
  {
    key: 'title',
    content: <ListHeaderTitleCell />,
    flex: 9,
    alignment: 'start',
    sortable: true,
  },
];
