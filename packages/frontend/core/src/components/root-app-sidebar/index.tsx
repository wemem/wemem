import { AnimatedDeleteIcon } from '@affine/component';
import { AddFeedButton } from '@affine/core/components/app-sidebar/add-feed-button';
import { AppSidebarJournalButton } from '@affine/core/components/root-app-sidebar/journal-button';
import { getDNDId } from '@affine/core/hooks/affine/use-global-dnd-helper';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { CollectionService } from '@affine/core/modules/collection';
import { TelemetryWorkspaceContextService } from '@affine/core/modules/telemetry/services/telemetry';
import { mixpanel } from '@affine/core/utils';
import { apis, events } from '@affine/electron-api';
import { useI18n } from '@affine/i18n';
import { FolderIcon, SettingsIcon } from '@blocksuite/icons/rc';
import type { Doc } from '@blocksuite/store';
import { useDroppable } from '@dnd-kit/core';
import type { Workspace } from '@toeverything/infra';
import { useLiveData, useService } from '@toeverything/infra';
import { useAtomValue } from 'jotai';
import { nanoid } from 'nanoid';
import type { HTMLAttributes, ReactElement } from 'react';
import { forwardRef, memo, useCallback, useEffect } from 'react';
import { PiArchive, PiTimer } from 'react-icons/pi';

import { useAppSettingHelper } from '../../hooks/affine/use-app-setting-helper';
import { useNavigateHelper } from '../../hooks/use-navigate-helper';
import { WorkbenchService } from '../../modules/workbench';
import {
  // AddPageButton,
  // AppDownloadButton,
  AppSidebar,
  appSidebarOpenAtom,
  CategoryDivider,
  MenuItem,
  MenuLinkItem,
  QuickSearchInput,
  SidebarContainer,
  SidebarScrollableContainer,
} from '../app-sidebar';
import { createEmptyCollection, useEditCollectionName } from '../page-list';
import { CollectionsList } from '../pure/workspace-slider-bar/collections';
import { AddCollectionButton } from '../pure/workspace-slider-bar/collections/add-collection-button';
import FavoriteList from '../pure/workspace-slider-bar/favorite/favorite-list';
import { SubscriptionsList } from '../pure/workspace-slider-bar/subscriptions';
import { WorkspaceSelector } from '../workspace-selector';
import ImportPage from './import-page';
import { workspaceAndUserWrapper, workspaceWrapper } from './index.css';
// import { AppSidebarJournalButton } from './journal-button';
// import { UpdaterButton } from './updater-button';
import { UserInfo } from './user-info';

export type RootAppSidebarProps = {
  isPublicWorkspace: boolean;
  onOpenQuickSearchModal: () => void;
  onOpenNewFeedModal: () => void;
  onOpenSettingModal: () => void;
  currentWorkspace: Workspace;
  openPage: (pageId: string) => void;
  createPage: () => Doc;
  paths: {
    all: (workspaceId: string) => string;
    trash: (workspaceId: string) => string;
    shared: (workspaceId: string) => string;
    later: (workspaceId: string) => string;
    archive: (workspaceId: string) => string;
  };
};

const RouteMenuLinkItem = forwardRef<
  HTMLDivElement,
  {
    path: string;
    icon: ReactElement;
    active?: boolean;
    children?: ReactElement;
  } & HTMLAttributes<HTMLDivElement>
>(({ path, icon, active, children, ...props }, ref) => {
  return (
    <MenuLinkItem
      ref={ref}
      {...props}
      active={active}
      to={path ?? ''}
      icon={icon}
    >
      {children}
    </MenuLinkItem>
  );
});
RouteMenuLinkItem.displayName = 'RouteMenuLinkItem';

/**
 * This is for the whole affine app sidebar.
 * This component wraps the app sidebar in `@affine/component` with logic and data.
 *
 * @todo(himself65): rewrite all styled component into @vanilla-extract/css
 */
export const RootAppSidebar = memo(
  ({
    currentWorkspace,
    openPage,
    createPage,
    paths,
    onOpenQuickSearchModal,
    onOpenNewFeedModal,
    onOpenSettingModal,
  }: RootAppSidebarProps): ReactElement => {
    const currentWorkspaceId = currentWorkspace.id;
    const { appSettings } = useAppSettingHelper();
    const docCollection = currentWorkspace.docCollection;
    const t = useI18n();
    const currentPath = useLiveData(
      useService(WorkbenchService).workbench.location$.map(
        location => location.pathname
      )
    );

    const telemetry = useService(TelemetryWorkspaceContextService);

    const allPageActive = currentPath === '/all';

    const trashActive = currentPath === '/trash';
    const archiveActive = currentPath === '/archive';
    const laterActive = currentPath === '/later';

    const onClickNewPage = useAsyncCallback(async () => {
      const page = createPage();
      page.load();
      openPage(page.id);
      mixpanel.track('DocCreated', {
        page: telemetry.getPageContext(),
        segment: 'navigation panel',
        module: 'bottom button',
        control: 'new doc button',
        category: 'page',
        type: 'doc',
      });
    }, [createPage, openPage, telemetry]);

    const navigateHelper = useNavigateHelper();
    // Listen to the "New Page" action from the menu
    useEffect(() => {
      if (environment.isDesktop) {
        return events?.applicationMenu.onNewPageAction(onClickNewPage);
      }
      return;
    }, [onClickNewPage]);

    const sidebarOpen = useAtomValue(appSidebarOpenAtom);
    useEffect(() => {
      if (environment.isDesktop) {
        apis?.ui.handleSidebarVisibilityChange(sidebarOpen).catch(err => {
          console.error(err);
        });
      }
    }, [sidebarOpen]);

    const dropItemId = getDNDId('sidebar-trash', 'container', 'trash');
    const trashDroppable = useDroppable({
      id: dropItemId,
    });

    const collection = useService(CollectionService);
    const { node, open } = useEditCollectionName({
      title: t['com.affine.editCollection.createCollection'](),
      showTips: true,
    });
    const handleCreateCollection = useCallback(() => {
      open('')
        .then(name => {
          const id = nanoid();
          collection.addCollection(createEmptyCollection(id, { name }));
          navigateHelper.jumpToCollection(docCollection.id, id);
        })
        .catch(err => {
          console.error(err);
        });
    }, [docCollection.id, collection, navigateHelper, open]);

    return (
      <AppSidebar
        clientBorder={appSettings.clientBorder}
        translucentUI={appSettings.enableBlurBackground}
      >
        <SidebarContainer>
          {process.env.NODE_ENV !== 'production' && (
            <div className={workspaceAndUserWrapper}>
              <div className={workspaceWrapper}>
                <WorkspaceSelector />
              </div>
              <UserInfo />
            </div>
          )}
          <div className={workspaceAndUserWrapper}>
            <div className={workspaceWrapper}>
              <QuickSearchInput
                data-testid="slider-bar-quick-search-button"
                onClick={onOpenQuickSearchModal}
              />
            </div>
            <UserInfo />
          </div>
          {/* <QuickSearchInput
            data-testid="slider-bar-quick-search-button"
            onClick={onOpenQuickSearchModal}
          /> */}
          <RouteMenuLinkItem
            icon={<FolderIcon />}
            active={allPageActive}
            path={paths.all(currentWorkspaceId)}
          >
            <span data-testid="all-pages">
              {t['com.affine.workspaceSubPath.all']()}
            </span>
          </RouteMenuLinkItem>
          <AppSidebarJournalButton
            docCollection={currentWorkspace.docCollection}
          />
          <RouteMenuLinkItem
            icon={<PiTimer size={20} />}
            active={laterActive}
            path={paths.later(currentWorkspaceId)}
          >
            <span data-testid="later-page">
              {t['ai.readflow.workspaceSubPath.later']()}
            </span>
          </RouteMenuLinkItem>
          <RouteMenuLinkItem
            icon={<PiArchive size={20} />}
            active={archiveActive}
            path={paths.archive(currentWorkspaceId)}
          >
            <span data-testid="archive-page">
              {t['ai.readflow.workspaceSubPath.archive']()}
            </span>
          </RouteMenuLinkItem>
          {runtimeConfig.enableNewSettingModal ? (
            <MenuItem
              data-testid="slider-bar-workspace-setting-button"
              icon={<SettingsIcon />}
              onClick={onOpenSettingModal}
            >
              <span data-testid="settings-modal-trigger">
                {t['com.affine.settingSidebar.title']()}
              </span>
            </MenuItem>
          ) : null}
        </SidebarContainer>
        <SidebarScrollableContainer>
          <FavoriteList docCollection={docCollection} />
          <CategoryDivider label={t['com.affine.rootAppSidebar.collections']()}>
            <AddCollectionButton node={node} onClick={handleCreateCollection} />
          </CategoryDivider>
          <CollectionsList
            docCollection={docCollection}
            onCreate={handleCreateCollection}
          />
          <SubscriptionsList docCollection={docCollection} />
          <CategoryDivider label={t['com.affine.rootAppSidebar.others']()} />
          {/* fixme: remove the following spacer */}
          <div style={{ height: '4px' }} />
          <div style={{ padding: '0 8px' }}>
            <RouteMenuLinkItem
              ref={trashDroppable.setNodeRef}
              icon={<AnimatedDeleteIcon closed={trashDroppable.isOver} />}
              active={trashActive || trashDroppable.isOver}
              path={paths.trash(currentWorkspaceId)}
            >
              <span data-testid="trash-page">
                {t['com.affine.workspaceSubPath.trash']()}
              </span>
            </RouteMenuLinkItem>
            <ImportPage docCollection={docCollection} />
          </div>
        </SidebarScrollableContainer>
        <SidebarContainer>
          {/*{environment.isDesktop ? <UpdaterButton /> : <AppDownloadButton />}*/}
          <div style={{ height: '4px' }} />
          <AddFeedButton onClick={onOpenNewFeedModal} />
        </SidebarContainer>
      </AppSidebar>
    );
  }
);

RootAppSidebar.displayName = 'memo(RootAppSidebar)';
