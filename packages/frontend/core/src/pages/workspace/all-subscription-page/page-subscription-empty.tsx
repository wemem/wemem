import { Empty } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { useAtomValue } from 'jotai';

import * as styles from './page-subscription-empty.css';
import * as headerStyles from './subscription-page-header.css';
import {
  subscriptionSidebarOpen,
  SubscriptionSidebarSwitch,
} from './subscription-sidebar-switch';

export const EmptySubscriptionPage = () => {
  const t = useI18n();
  const leftSidebarOpen = useAtomValue(subscriptionSidebarOpen);
  return (
    <div className={styles.pageListEmptyStyle}>
      <div className={headerStyles.header}>
        <SubscriptionSidebarSwitch show={!leftSidebarOpen} />
        <div className={headerStyles.spacer} />
      </div>
      <Empty title={t['com.affine.emptyDesc']()} />
    </div>
  );
};
