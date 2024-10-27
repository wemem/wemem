import { Button, RadioGroup, type RadioItem } from '@affine/component';
import { AppSidebarService } from '@affine/core/modules/app-sidebar';
import { SidebarSwitch } from '@affine/core/modules/app-sidebar/views';
import { ReadStatus } from '@affine/core/modules/feeds/types';
import type { Filter } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import type { DocMeta } from '@blocksuite/store';
import { DocsService, useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useNavigateHelper } from '../hooks/use-navigate-helper';
// import { FeedsPageListDisplayMenu } from './feeds-page-list-display-menu';
import * as styles from './feeds-page-list-header.css';
// import { FeedsPageListHeaderOperationsMenu } from './feeds-page-list-header-operations-menu';

export const getOptions = (t: ReturnType<typeof useI18n>) =>
  [
    {
      value: 'all',
      label: t['ai.wemem.feed-docs.all'](),
      testId: 'feeds-all-trigger',
    },
    {
      value: 'unread',
      label: t['ai.wemem.feed-docs.unread'](),
      testId: 'feeds-unread-trigger',
    },
    {
      value: 'read',
      label: t['ai.wemem.feed-docs.read'](),
      testId: 'feeds-read-trigger',
    },
  ] satisfies RadioItem[];

export const FeedsDocsPageListHeader = ({
  workspaceId,
  filteredPageMetas,
}: {
  workspaceId: string;
  filteredPageMetas: DocMeta[];
  currentFilters: Filter[];
  onChangeCurrentFilters: (filters: Filter[]) => void;
}) => {
  const t = useI18n();
  const params = useParams();
  const { jumpToFeedsDocs } = useNavigateHelper();
  const onStatusChange = (status: 'all' | 'unread' | 'read') => {
    jumpToFeedsDocs(workspaceId, status, params.feedId as string);
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

  const docRecordList = useService(DocsService).list;
  const [marking, setMarking] = useState(false);
  const onMarkAllAsRead = useCallback(() => {
    setMarking(true);
    filteredPageMetas.forEach(meta => {
      const record = docRecordList.doc$(meta.id).value;
      if (!record) {
        return;
      }
      record.markAsRead();
    });
    setMarking(false);
  }, [docRecordList, filteredPageMetas]);

  const radioItems = useMemo<RadioItem[]>(() => getOptions(t), [t]);

  return (
    <div className={styles.docListHeader}>
      <div className={styles.docListHeaderTitle}>
        <div className={styles.listRightButton}>
          <SidebarSwitch
            show={!leftSidebarOpen}
            className={styles.leftSidebarButton}
          />
          <RadioGroup
            items={radioItems}
            value={params.status}
            width={132}
            onChange={onStatusChange}
          />
        </div>
        {/* <div className={styles.listRightButton}>
          <FeedsPageListHeaderOperationsMenu
            filterList={currentFilters}
            onChangeFilterList={onChangeCurrentFilters}
            propertiesMeta={propertiesMeta}
          />
        </div> */}
      </div>
      <div className={styles.rightButtonGroup}>
        {(params.status === ReadStatus.ALL ||
          params.status === ReadStatus.UNREAD) && (
          <Button
            className={styles.addPageButton}
            loading={marking}
            onClick={onMarkAllAsRead}
          >
            {t['ai.wemem.feed-docs.mark-all-as-read']()}
          </Button>
        )}
        {/* <FeedsPageListDisplayMenu /> */}
      </div>
    </div>
  );
};
