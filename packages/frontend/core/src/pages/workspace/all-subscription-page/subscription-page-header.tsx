import { Button, IconButton, Tooltip } from '@affine/component';
import { openInfoModalAtom } from '@affine/core/atoms';
import {
  InfoModal,
  PagePropertiesManager,
} from '@affine/core/components/affine/page-properties';
import { OriginalProperty } from '@affine/core/components/affine/page-properties/internal-properties';
import { BlocksuiteHeaderTitle } from '@affine/core/components/blocksuite/block-suite-header/title';
import { EditorModeSwitch } from '@affine/core/components/blocksuite/block-suite-mode-switch';
import { FavoriteTag } from '@affine/core/components/page-list';
import {
  useDeepReading,
  useToggleFavoritePage,
} from '@affine/core/components/page-list/subscription-page-list/subscription-hooks';
import { PageOperationCell } from '@affine/core/components/page-list/subscription-page-list/subscription-operation-cell';
import { useCurrentWorkspacePropertiesAdapter } from '@affine/core/hooks/use-affine-adapter';
import { FavoriteItemsAdapter } from '@affine/core/modules/properties';
import { RightSidebarService } from '@affine/core/modules/right-sidebar';
import { getRefPageId } from '@affine/core/modules/tag/entities/internal-tag';
import { ToggleButton } from '@affine/core/modules/workbench/view/route-container';
import { useI18n } from '@affine/i18n';
import { LinkIcon } from '@blocksuite/icons/rc';
import type { DocCollection, DocMeta } from '@blocksuite/store';
import {
  type Doc,
  type DocMode,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';

import * as styles from './subscription-page-header.css';
import {
  subscriptionSidebarOpen,
  SubscriptionSidebarSwitch,
} from './subscription-sidebar-switch';

export function SubscriptionPageHeader({
  page,
  publishMode,
  docCollection,
}: {
  page: Doc;
  publishMode: DocMode;
  docCollection: DocCollection;
}) {
  const t = useI18n();
  const pageMeta = useLiveData(page.meta$) as DocMeta;
  const rightSidebar = useService(RightSidebarService).rightSidebar;
  const rightSidebarOpen = useLiveData(rightSidebar.isOpen$);
  const leftSidebarOpen = useAtomValue(subscriptionSidebarOpen);
  const handleToggleRightSidebar = useCallback(() => {
    rightSidebar.toggle();
  }, [rightSidebar]);

  const refPageId = getRefPageId(pageMeta.tags) as string;
  const favAdapter = useService(FavoriteItemsAdapter);
  const favorite = useLiveData(favAdapter.isFavorite$(refPageId, 'doc'));

  const deepReading = useDeepReading(pageMeta);
  const toggleFavoritePage = useToggleFavoritePage(pageMeta);

  const currentWorkspace = useService(WorkspaceService).workspace;
  const blocksuiteDoc = currentWorkspace.docCollection.getDoc(page.id);

  const [openInfoModal, setOpenInfoModal] = useAtom(openInfoModalAtom);

  const adapter = useCurrentWorkspacePropertiesAdapter();
  const originalUrl = useMemo(() => {
    const manager = new PagePropertiesManager(adapter, page.id);
    const originalProperty = manager.getCustomProperty(OriginalProperty.id);
    return originalProperty ? originalProperty.value : null;
  }, [adapter, page.id]);

  return (
    <div className={styles.header}>
      <SubscriptionSidebarSwitch show={!leftSidebarOpen} />
      <EditorModeSwitch
        isPublic
        docCollection={docCollection}
        pageId={page.id}
        publicMode={publishMode}
      />
      <BlocksuiteHeaderTitle
        docCollection={docCollection}
        pageId={page.id}
        isPublic={true}
      />
      <div className={styles.iconButtonContainer}>
        <FavoriteTag
          data-testid="pin-button"
          active={!!favorite}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={toggleFavoritePage}
        />
        {originalUrl && <OpenOriginal originalUrl={originalUrl} />}
        <PageOperationCell page={pageMeta} />
      </div>
      <div className={styles.spacer} />
      <div className={styles.rightItemContainer}>
        <Button
          className={styles.editButton}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={deepReading}
          data-testid="share-page-edit-button"
          type="primary"
        >
          {t['ai.readease.subscription.deep-reading']()}
        </Button>
      </div>
      <ToggleButton
        show={!rightSidebarOpen}
        className={styles.rightSidebarButton}
        onToggle={handleToggleRightSidebar}
      />
      {blocksuiteDoc && (
        <InfoModal
          open={openInfoModal}
          onOpenChange={setOpenInfoModal}
          page={blocksuiteDoc}
          workspace={currentWorkspace}
        />
      )}
    </div>
  );
}

export const OpenOriginal = ({ originalUrl }: { originalUrl: string }) => {
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
      content={t['ai.readease.subscription.detail.open-original']()}
      side="top"
    >
      <IconButton onClick={handleClick}>
        <LinkIcon />
      </IconButton>
    </Tooltip>
  );
};
