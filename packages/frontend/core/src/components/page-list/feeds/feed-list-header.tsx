import { Button } from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { ReactElement } from 'react';

import * as styles from './feed-list-header.css';

export const FeedListHeader = ({
  node,
  onCreate,
}: {
  node: ReactElement | null;
  onCreate: () => void;
}) => {
  const t = useAFFiNEI18N();

  return (
    <>
      <div className={styles.feedListHeader}>
        <div className={styles.feedListHeaderTitle}>
          {t['ai.readflow.feeds.header']()}
        </div>
        <Button className={styles.newFeedButton} onClick={onCreate}>
          {t['ai.readflow.feeds.new-feed-button']()}
        </Button>
      </div>
      {node}
    </>
  );
};
