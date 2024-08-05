import { Button, FlexWrapper, Menu } from '@affine/component';
import type { Filter, PropertiesMeta } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { FilterIcon } from '@blocksuite/icons/rc';

import { SubscrptionPageListCreateFilterMenu } from './subscription-page-list-create-filter-menu';
import * as styles from './subscription-page-list-header-operations-menu.css';

export const SubscriptionFeedPageListHeaderOperationsMenu = ({
  propertiesMeta,
  filterList,
  onChangeFilterList,
}: {
  propertiesMeta: PropertiesMeta;
  filterList: Filter[];
  onChangeFilterList: (filterList: Filter[]) => void;
}) => {
  const t = useI18n();

  return (
    <FlexWrapper alignItems="center">
      <Menu
        items={
          <SubscrptionPageListCreateFilterMenu
            propertiesMeta={propertiesMeta}
            value={filterList}
            onChange={onChangeFilterList}
          />
        }
      >
        <Button
          className={styles.filterMenuTrigger}
          type="default"
          icon={<FilterIcon />}
          data-testid="create-first-filter"
        >
          {t['com.affine.filter']()}
        </Button>
      </Menu>
    </FlexWrapper>
  );
};
