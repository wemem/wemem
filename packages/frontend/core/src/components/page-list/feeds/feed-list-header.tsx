import { Button } from '@affine/component';
import { useI18n } from '@affine/i18n';

import * as styles from './feed-list-header.css';

export const FeedListHeader = ({ onCreate }: { onCreate: () => void }) => {
  const t = useI18n();

  return (
    <div className={styles.feedListHeader}>
      <div className={styles.feedListHeaderTitle}>
        {t['ai.wemem.subscription.header']()}
      </div>
      <Button className={styles.newFeedButton} onClick={onCreate}>
        {t['ai.wemem.subscription.new-feed-button']()}
      </Button>
    </div>
  );
};
