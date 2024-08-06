import { Button, RadioButton, RadioButtonGroup } from '@affine/component';
import { FeedPageListOperationsMenu } from '@affine/core/components/page-list/docs/page-list-header-feed-operations-menu';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import {
  SeenTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import type { Filter } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import type { DocCollection, DocMeta } from '@blocksuite/store';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { appSidebarOpenAtom, SidebarSwitch } from '../../app-sidebar';
import { SubscriptionPageListDisplayMenu } from './subscription-page-list-display-menu';
import * as styles from './subscription-page-list-header.css';
import { SubscriptionFeedPageListHeaderOperationsMenu } from './subscription-page-list-header-operations-menu';

export const SubscriptionDocsPageListHeader = ({
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
  const onStatusChange = (status: 'seen' | 'unseen') => {
    jumpToSubscriptionDocs(workspaceId, status, params.subscriptionId);
  };
  const leftSidebarOpen = useAtomValue(appSidebarOpenAtom);

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
        <div className={styles.listRightButton}>
          <SidebarSwitch
            show={!leftSidebarOpen}
            className={styles.leftSidebarButton}
          />
          <RadioButtonGroup
            value={params.status}
            onValueChange={onStatusChange}
          >
            <RadioButton
              value="unseen"
              data-testid="workspace-feed-docs-unseen-button"
            >
              {t['ai.readease.feed-docs.unseen']()}
            </RadioButton>
            <RadioButton
              value="seen"
              data-testid="workspace-feed-docs-seen-button"
            >
              {t['ai.readease.feed-docs.seen']()}
            </RadioButton>
          </RadioButtonGroup>
        </div>
        <div className={styles.listRightButton}>
          <SubscriptionFeedPageListHeaderOperationsMenu
            filterList={currentFilters}
            onChangeFilterList={onChangeCurrentFilters}
            propertiesMeta={propertiesMeta}
          />
        </div>
      </div>
      <div className={styles.rightButtonGroup}>
        {params.status === 'unseen' && (
          <Button
            className={styles.addPageButton}
            loading={marking}
            onClick={onMarkAllAsSeen}
          >
            {t['ai.readease.feed-docs.mark-all-as-seen']()}
          </Button>
        )}
        <SubscriptionPageListDisplayMenu />
      </div>
    </div>
  );
};
