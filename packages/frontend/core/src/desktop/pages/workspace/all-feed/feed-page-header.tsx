import { Button, EarthIcon, IconButton, Tooltip } from '@affine/component';
import { PagePropertiesManager } from '@affine/core/components/affine/page-properties';
import { OriginalProperty } from '@affine/core/components/affine/page-properties/internal-properties';
import { BlocksuiteHeaderTitle } from '@affine/core/components/blocksuite/block-suite-header/title';
import { EditorModeSwitch } from '@affine/core/components/blocksuite/block-suite-mode-switch';
import { useCurrentWorkspacePropertiesAdapter } from '@affine/core/components/hooks/use-affine-adapter';
import { FavoriteTag } from '@affine/core/components/page-list';
import {
  useDeepReading,
  useToggleFavoritePage,
} from '@affine/core/components/page-list/feeds-page-list/feeds-hooks';
import { PageOperationCell } from '@affine/core/components/page-list/feeds-page-list/feeds-operation-cell';
import { DocInfoService } from '@affine/core/modules/doc-info';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import { getRefPageId } from '@affine/core/modules/tag/entities/internal-tag';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { ToggleButton } from '@affine/core/modules/workbench/view/route-container';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import type { DocMeta } from '@blocksuite/store';
import {
  type Doc,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';

import * as styles from './feed-page-header.css';
import { feedSidebarOpen, FeedSidebarSwitch } from './feed-sidebar-switch';

export function FeedPageHeader({ page }: { page: Doc }) {
  const t = useI18n();
  const pageMeta = useLiveData(page.meta$) as DocMeta;
  const workbench = useService(WorkbenchService).workbench;
  const rightSidebarOpen = useLiveData(workbench.sidebarOpen$);
  const leftSidebarOpen = useAtomValue(feedSidebarOpen);
  const handleToggleRightSidebar = useCallback(() => {
    workbench.toggleSidebar();
  }, [workbench]);

  const refPageId = getRefPageId(pageMeta.tags) as string;
  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favorite = useLiveData(favAdapter.isFavorite$(refPageId, 'doc'));

  const deepReading = useDeepReading(pageMeta);
  const toggleFavoritePage = useToggleFavoritePage(pageMeta);

  const currentWorkspace = useService(WorkspaceService).workspace;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const _blocksuiteDoc = currentWorkspace.docCollection.getDoc(page.id);

  const docInfoModal = useService(DocInfoService).modal;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const _openInfoModal = useCallback(() => {
    track.$.header.pageInfo.open();
    docInfoModal.open(page.id);
  }, [docInfoModal, page.id]);

  const adapter = useCurrentWorkspacePropertiesAdapter();
  const originalUrl = useMemo(() => {
    const manager = new PagePropertiesManager(adapter, page.id);
    const originalProperty = manager.getCustomProperty(OriginalProperty.id);
    return originalProperty ? originalProperty.value : null;
  }, [adapter, page.id]);

  return (
    <div className={styles.header}>
      <FeedSidebarSwitch show={!leftSidebarOpen} />
      <EditorModeSwitch />
      <BlocksuiteHeaderTitle docId={page.id} />
      <div className={styles.iconButtonContainer}>
        <FavoriteTag
          data-testid="pin-button"
          active={!!favorite}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={toggleFavoritePage}
        />
        {originalUrl && <ViewSource originalUrl={originalUrl} />}
        <PageOperationCell page={pageMeta} />
      </div>
      <div className={styles.spacer} />
      <div className={styles.rightItemContainer}>
        <Button
          className={styles.editButton}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={deepReading}
          data-testid="share-page-edit-button"
          variant="primary"
        >
          {t['ai.wemem.feeds.deep-reading']()}
        </Button>
      </div>
      <ToggleButton
        show={!rightSidebarOpen}
        className={styles.rightSidebarButton}
        onToggle={handleToggleRightSidebar}
      />
    </div>
  );
}

export const ViewSource = ({ originalUrl }: { originalUrl: string }) => {
  const t = useI18n();
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      window.open(originalUrl, '_blank');
    },
    [originalUrl]
  );
  return (
    <Tooltip
      content={t['ai.wemem.feeds.detail.view-source-content']()}
      side="top"
    >
      <IconButton onClick={handleClick}>
        <EarthIcon />
      </IconButton>
    </Tooltip>
  );
};
