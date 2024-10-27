import { Empty } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { useAtomValue } from 'jotai';
import { memo } from 'react';

import * as styles from './feed-page-empty.css';
import * as headerStyles from './feed-page-header.css';
import { feedSidebarOpen, FeedSidebarSwitch } from './feed-sidebar-switch';

const FeedPageEmptyBase = () => {
  const t = useI18n();
  const leftSidebarOpen = useAtomValue(feedSidebarOpen);
  return (
    <div className={styles.pageListEmptyStyle}>
      <div className={headerStyles.header}>
        <FeedSidebarSwitch show={!leftSidebarOpen} />
        <div className={headerStyles.spacer} />
      </div>
      <Empty title={t['com.affine.emptyDesc']()} />
    </div>
  );
};

export const FeedPageEmpty = memo(FeedPageEmptyBase);
