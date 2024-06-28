import { Button } from '@affine/component';
import { useI18n } from '@affine/i18n';
import type { ReactElement } from 'react';

import * as styles from './feed-list-header.css';

export const FeedListHeader = ({
  node,
  onCreate,
}: {
  node: ReactElement | null;
  onCreate: () => void;
}) => {
  const t = useI18n();

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
