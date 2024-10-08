import { useI18n } from '@affine/i18n';
import { SearchIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCommandState } from 'cmdk';

import * as styles from './not-found.css';
import { NewFeedService } from '@affine/core/modules/feed-newly';

export const NotFoundGroup = () => {
  const subscribeFeed = useService(NewFeedService).subscribeFeed;
  const query = useLiveData(subscribeFeed.query$);
  // hack: we know that the filtered count is 3 when there is no result (create page & edgeless & append to journal, for mode === 'cmdk')
  const renderNoResult = useCommandState(state => state.filtered.count === 3);

  const t = useI18n();

  if (!renderNoResult) {
    return null;
  }
  return (
    <div className={styles.notFoundContainer}>
      <div
        className={styles.notFoundTitle}
        data-testid="cmdk-search-not-found"
      >{`Search for "${query}"`}</div>
      <div className={styles.notFoundItem}>
        <div className={styles.notFoundIcon}>
          <SearchIcon />
        </div>
        <div className={styles.notFoundText}>
          {t['com.affine.cmdk.no-results']()}
        </div>
      </div>
    </div>
  );
};
