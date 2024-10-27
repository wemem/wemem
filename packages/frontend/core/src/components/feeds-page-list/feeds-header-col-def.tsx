import { Trans } from '@affine/i18n';
import { useMemo } from 'react';

import type { HeaderColDef } from '../page-list';
import { ListHeaderTitleCell } from '../page-list';
import { useFeedsPageListDisplayProperties } from './feeds-hooks';
export const usePageHeaderColsDef = (): HeaderColDef[] => {
  const [displayProperties] = useFeedsPageListDisplayProperties();

  return useMemo(
    () => [
      {
        key: 'title',
        content: <ListHeaderTitleCell />,
        flex: 6,
        alignment: 'start',
        sortable: true,
      },
      {
        key: 'createDate',
        content: <Trans i18nKey="Created" />,
        flex: 1,
        sortable: true,
        alignment: 'end',
        hideInSmallContainer: false,
        hidden: !displayProperties.displayProperties.createDate,
      },
      {
        key: 'actions',
        content: '',
        flex: 1,
        alignment: 'end',
        hideInSmallContainer: true,
      },
    ],
    [displayProperties]
  );
};
