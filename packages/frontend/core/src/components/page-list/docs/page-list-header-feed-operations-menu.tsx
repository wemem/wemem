import { Button, FlexWrapper, Menu } from '@affine/component';
import type { Filter, PropertiesMeta } from '@affine/env/filter';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { FilterIcon } from '@blocksuite/icons';

import { CreateFilterMenu } from '../filter/vars';
import * as styles from './page-list-header-feed-operations-menu.css';

export const FeedPageListOperationsMenu = ({
  propertiesMeta,
  filterList,
  onChangeFilterList,
}: {
  propertiesMeta: PropertiesMeta;
  filterList: Filter[];
  onChangeFilterList: (filterList: Filter[]) => void;
}) => {
  const t = useAFFiNEI18N();

  return (
    <FlexWrapper alignItems="center">
      <Menu
        items={
          <CreateFilterMenu
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
