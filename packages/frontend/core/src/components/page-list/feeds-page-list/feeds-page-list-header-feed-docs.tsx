import { Button, RadioButton, RadioButtonGroup } from '@affine/component';
import { AppSidebarService } from '@affine/core/modules/app-sidebar';
import { SidebarSwitch } from '@affine/core/modules/app-sidebar/views';
import {
  SeenTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import type { Filter } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import type { DocCollection, DocMeta } from '@blocksuite/store';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useNavigateHelper } from '../../hooks/use-navigate-helper';
import { FeedsPageListDisplayMenu } from './feeds-page-list-display-menu';
import * as styles from './feeds-page-list-header.css';
import { FeedsPageListHeaderOperationsMenu } from './feeds-page-list-header-operations-menu';

export const FeedsDocsPageListHeader = ({
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
  const { jumpToFeedsDocs } = useNavigateHelper();
  const onStatusChange = (status: 'seen' | 'unseen') => {
    jumpToFeedsDocs(workspaceId, status, params.feedId);
  };

  const appSidebarService = useService(AppSidebarService).sidebar;
  const leftSidebarOpen = useLiveData(appSidebarService.open$);

  const [_floating, setFloating] = useState(false);
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
              {t['ai.wemem.feed-docs.unseen']()}
            </RadioButton>
            <RadioButton
              value="seen"
              data-testid="workspace-feed-docs-seen-button"
            >
              {t['ai.wemem.feed-docs.seen']()}
            </RadioButton>
          </RadioButtonGroup>
        </div>
        <div className={styles.listRightButton}>
          <FeedsPageListHeaderOperationsMenu
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
            {t['ai.wemem.feed-docs.mark-all-as-seen']()}
          </Button>
        )}
        <FeedsPageListDisplayMenu />
      </div>
    </div>
  );
};
