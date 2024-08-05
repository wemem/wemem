import { Trans } from '@affine/i18n';
import { useMemo } from 'react';

import { ListHeaderTitleCell } from '../page-header';
import type { HeaderColDef } from '../types';
import { useSubscriptionPageListDisplayProperties } from './subscription-hooks';
export const usePageHeaderColsDef = (): HeaderColDef[] => {
  const [displayProperties] = useSubscriptionPageListDisplayProperties();

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
