import { Button, RadioButton, RadioButtonGroup } from '@affine/component';
import { PageDisplayMenu } from '@affine/core/components/page-list';
import { FeedPageListOperationsMenu } from '@affine/core/components/page-list/docs/page-list-header-feed-operations-menu';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import type { Filter, PropertiesMeta } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import * as styles from './page-list-header.css';
import * as feedStyles from './page-list-header-feed.css';

export const FeedDocsPageListHeader = ({
  workspaceId,
  propertiesMeta,
  currentFilters,
  onChangeCurrentFilters,
}: {
  workspaceId: string;
  propertiesMeta: PropertiesMeta;
  currentFilters: Filter[];
  onChangeCurrentFilters: (filters: Filter[]) => void;
}) => {
  const t = useI18n();
  const params = useParams();
  const { jumpToSubscriptionDocs } = useNavigateHelper();
  const onStatusChange = (status: 'true' | 'false') => {
    jumpToSubscriptionDocs(workspaceId, status);
  };

  const [floating, setFloating] = useState(false);
  useEffect(() => {
    const onResize = () => setFloating(!!(window.innerWidth < 768));
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={styles.docListHeader}>
      <div className={styles.docListHeaderTitle}>
        <div style={{ cursor: 'pointer', display: floating ? 'none' : 'flex' }}>
          {t['ai.readflow.feed-docs.header']()}
        </div>
        <div className={feedStyles.listRightButton}>
          <RadioButtonGroup
            value={params.status}
            onValueChange={onStatusChange}
          >
            <RadioButton
              value="false"
              data-testid="workspace-feed-docs-unseen-button"
            >
              {t['ai.readflow.feed-docs.unseen']()}
            </RadioButton>
            <RadioButton
              value="true"
              data-testid="workspace-feed-docs-seen-button"
            >
              {t['ai.readflow.feed-docs.seen']()}
            </RadioButton>
          </RadioButtonGroup>
        </div>
        <div className={feedStyles.listRightButton}>
          <FeedPageListOperationsMenu
            filterList={currentFilters}
            onChangeFilterList={onChangeCurrentFilters}
            propertiesMeta={propertiesMeta}
          />
        </div>
      </div>
      <div className={styles.rightButtonGroup}>
        {params.status === 'false' && (
          <Button className={styles.addPageButton}>
            {t['ai.readflow.feed-docs.mark-all-as-seen']()}
          </Button>
        )}
        <PageDisplayMenu />
      </div>
    </div>
  );
};
