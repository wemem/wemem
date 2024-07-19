import { Button } from '@affine/component';
import {
  PageDisplayMenu,
  useEditFeed,
} from '@affine/core/components/page-list';
import { FeedPageListOperationsMenu } from '@affine/core/components/page-list/docs/page-list-header-feed-operations-menu';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import type { Collection, Filter, PropertiesMeta } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { useCallback } from 'react';

import * as styles from './page-list-header.css';
import * as feedStyles from './page-list-header-feed.css';

export const FeedPageListHeader = ({
  collection,
  workspaceId,
  propertiesMeta,
  currentFilters,
  onChangeCurrentFilters,
}: {
  collection: Collection;
  workspaceId: string;
  propertiesMeta: PropertiesMeta;
  currentFilters: Filter[];
  onChangeCurrentFilters: (filters: Filter[]) => void;
}) => {
  const t = useI18n();
  const { jumpToManageSubscriptions } = useNavigateHelper();

  const handleJumpToFeeds = useCallback(() => {
    jumpToManageSubscriptions(workspaceId);
  }, [jumpToManageSubscriptions, workspaceId]);

  const { node, handleEditFeed } = useEditFeed(collection);

  return (
    <>
      {node}
      <div className={styles.docListHeader}>
        <div className={styles.docListHeaderTitle}>
          <div style={{ cursor: 'pointer' }} onClick={handleJumpToFeeds}>
            {t['ai.readflow.feeds.header']()} /
          </div>
          <div className={styles.titleIcon}>
            <FeedAvatar image={collection.feed?.image} />
          </div>
          <div className={styles.titleCollectionName}>{collection.name}</div>
          <div className={feedStyles.listRightButton}>
            <FeedPageListOperationsMenu
              filterList={currentFilters}
              onChangeFilterList={onChangeCurrentFilters}
              propertiesMeta={propertiesMeta}
            />
          </div>
        </div>
        <div className={styles.rightButtonGroup}>
          <Button className={styles.addPageButton} onClick={handleEditFeed}>
            {t['Edit']()}
          </Button>
          <PageDisplayMenu />
        </div>
      </div>
    </>
  );
};
