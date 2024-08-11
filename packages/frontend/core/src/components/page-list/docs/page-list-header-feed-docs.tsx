import { Button, RadioButton, RadioButtonGroup } from '@affine/component';
import { PageDisplayMenu } from '@affine/core/components/page-list';
import { FeedPageListOperationsMenu } from '@affine/core/components/page-list/docs/page-list-header-feed-operations-menu';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import {
  SeenTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import type { Filter } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import type { DocCollection, DocMeta } from '@blocksuite/store';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import * as styles from './page-list-header.css';
import * as feedStyles from './page-list-header-feed.css';

export const FeedDocsPageListHeader = ({
  workspaceId,
  filteredPageMetas,
  docCollection,
  currentFilters,
  onChangeCurrentFilters,
}: {
  workspaceId: string;
  filteredPageMetas: DocMeta[];
  docCollection: DocCollection;
  currentFilters: Filter[];
  onChangeCurrentFilters: (filters: Filter[]) => void;
}) => {
  const t = useI18n();
  const params = useParams();
  const propertiesMeta = docCollection.meta.properties;
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

  const [marking, setMarking] = useState(false);

  const onMarkAllAsSeen = useCallback(() => {
    setMarking(true);
    filteredPageMetas.forEach(meta => {
      if (meta?.tags.includes(UnseenTag.id)) {
        const tags = meta.tags.filter(tag => tag !== UnseenTag.id);
        tags.push(SeenTag.id);
        docCollection.setDocMeta(meta.id, {
          ...meta,
          tags,
        });
      }
    });
    setMarking(false);
  }, [docCollection, filteredPageMetas]);

  return (
    <div className={styles.docListHeader}>
      <div className={styles.docListHeaderTitle}>
        <div className={feedStyles.listRightButton}>
          <RadioButtonGroup
            value={params.status}
            onValueChange={onStatusChange}
          >
            <RadioButton
              value="false"
              data-testid="workspace-feed-docs-unseen-button"
            >
              {t['ai.readease.feed-docs.unseen']()}
            </RadioButton>
            <RadioButton
              value="true"
              data-testid="workspace-feed-docs-seen-button"
            >
              {t['ai.readease.feed-docs.seen']()}
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
          <Button loading={marking} onClick={onMarkAllAsSeen}>
            {t['ai.readease.feed-docs.mark-all-as-seen']()}
          </Button>
        )}
        <PageDisplayMenu />
      </div>
    </div>
  );
};
