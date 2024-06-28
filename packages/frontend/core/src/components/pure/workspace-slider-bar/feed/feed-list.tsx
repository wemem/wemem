import {
  toast,
} from '@affine/component';
import { RenameModal } from '@affine/component/rename-modal';
import { Button, IconButton } from '@affine/component/ui/button';
import {
  FeedOperations, filterPage, filterPageByRules, stopPropagation, useCreateFeed,
} from '@affine/core/components/page-list';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';
import { Doc } from '@affine/core/components/pure/workspace-slider-bar/collections';
import { AddFeedButton } from '@affine/core/components/pure/workspace-slider-bar/feed/add-feed-button';
import { useAllPageListConfig } from '@affine/core/hooks/affine/use-all-page-list-config';
import { getDNDId } from '@affine/core/hooks/affine/use-global-dnd-helper';
import { useBlockSuiteDocMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import { FavoriteItemsAdapter } from '@affine/core/modules/properties';
import { WorkbenchLink } from '@affine/core/modules/workbench';
import { UnseenFilter } from '@affine/core/pages/workspace/feed-docs';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import {
  MoreHorizontalIcon,
} from '@blocksuite/icons/rc';
import type { DocCollection } from '@blocksuite/store';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';
import { PiRss } from 'react-icons/pi';
import { VscSettings } from 'react-icons/vsc';

import { WorkbenchService } from '../../../../modules/workbench';
import { CategoryDivider, MenuLinkItem as SidebarMenuLinkItem } from '../../../app-sidebar';
import * as draggableMenuItemStyles from '../components/draggable-menu-item.css';
import type { FeedsListProps } from '../index';
import * as styles from './styles.css';

export const FeedSidebarNavItem = ({
                                     feed,
                                     docCollection,
                                     className,
                                   }: {
  feed: Collection;
  docCollection: DocCollection;
  className?: string;
}) => {
  const pages = useBlockSuiteDocMeta(docCollection);
  const [collapsed, setCollapsed] = useState(true);
  const [open, setOpen] = useState(false);
  const config = useAllPageListConfig();
  const feedService = useService(FeedService);
  const favAdapter = useService(FavoriteItemsAdapter);
  const favourites = useLiveData(favAdapter.favorites$);
  const t = useI18n();
  const dndId = getDNDId(
    'sidebar-collections',
    'collection',
    feed.id,
  );


  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname,
    ),
  );
  const path = `/feed/${feed.id}`;

  const onRename = useCallback(
    (name: string) => {
      feedService.updateFeed(feed.id, () => ({
        ...feed,
        name,
      }));
      toast(t['com.affine.toastMessage.rename']());
    },
    [feed, feedService, t],
  );
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const allPagesMeta = useMemo(
    () => Object.fromEntries(pages.map(v => [v.id, v])),
    [pages],
  );

  const pagesToRender = pages.filter(meta => {
    if (meta.trash) return false;
    const pageData = {
      meta,
      publicMode: config.getPublicMode(meta.id),
      favorite: favourites.some(fav => fav.id === meta.id),
    };
    return filterPage(feed, pageData);
  });

  return (
    <Collapsible.Root
      open={!collapsed}
      className={className}
    >
      <SidebarMenuLinkItem
        className={draggableMenuItemStyles.draggableMenuItem}
        data-testid="feed-item"
        data-feed-id={feed.id}
        data-type="feed-list-item"
        active={currentPath.includes(path)}
        icon={<FeedAvatar image={feed.feed?.image} />}
        to={path}
        onCollapsedChange={setCollapsed}
        linkComponent={WorkbenchLink}
        postfix={
          <div
            onClick={stopPropagation}
            onMouseDown={e => {
              // prevent drag
              e.stopPropagation();
            }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <FeedOperations
              feed={feed}
              openRenameModal={handleOpen}
            >
              <IconButton
                data-testid="feed-options"
                type="plain"
                size="small"
                style={{ marginLeft: 4 }}
              >
                <MoreHorizontalIcon />
              </IconButton>
            </FeedOperations>
            <RenameModal
              open={open}
              onOpenChange={setOpen}
              onRename={onRename}
              currentName={feed.name}
            />
          </div>
        }
        collapsed={pagesToRender.length > 0 ? collapsed : undefined}
      >
        <span>{feed.name}</span>
      </SidebarMenuLinkItem>
      <Collapsible.Content className={styles.collapsibleContent}>
        <div className={styles.docsListContainer}>
          {pagesToRender.map(page => {
            return (
              <Doc
                parentId={dndId}
                inAllowList={false}
                removeFromAllowList={() => {
                }}
                allPageMeta={allPagesMeta}
                doc={page}
                key={page.id}
                docCollection={docCollection}
              />
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};


const unseenPath = `/feed/seen/false`;
const seenPath = `/feed/seen/true`;

export const FeedSidebarReadFeeds = ({
                                       docCollection,
                                       className,
                                     }: {
  docCollection: DocCollection;
  className?: string;
}) => {
  const pages = useBlockSuiteDocMeta(docCollection);
  const [collapsed, setCollapsed] = useState(true);
  const config = useAllPageListConfig();
  const favAdapter = useService(FavoriteItemsAdapter);
  const favourites = useLiveData(favAdapter.favorites$);
  const t = useI18n();
  const dndId = getDNDId(
    'sidebar-collections',
    'collection',
    'unseed',
  );


  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname,
    ),
  );

  const allPagesMeta = useMemo(
    () => Object.fromEntries(pages.map(v => [v.id, v])),
    [pages],
  );

  const pagesToRender = pages.filter(meta => {
    if (meta.trash) return false;
    const pageData = {
      meta,
      publicMode: config.getPublicMode(meta.id),
      favorite: favourites.some(fav => fav.id === meta.id),
    };
    return filterPageByRules([UnseenFilter], [], pageData);
  });

  return (
    <Collapsible.Root
      open={!collapsed}
      className={className}
    >
      <SidebarMenuLinkItem
        className={draggableMenuItemStyles.draggableMenuItem}
        data-testid="feed-docs-unseen"
        data-type="feed-docs-unseen"
        active={currentPath.includes(unseenPath) || currentPath.includes(seenPath)}
        icon={<PiRss />}
        to={unseenPath}
        onCollapsedChange={setCollapsed}
        linkComponent={WorkbenchLink}
        collapsed={pagesToRender.length > 0 ? collapsed : undefined}
      >
        <span>{t['ai.readflow.rootAppSidebar.feeds.read-feeds']()}</span>
      </SidebarMenuLinkItem>
      <Collapsible.Content className={styles.collapsibleContent}>
        <div className={styles.docsListContainer}>
          {pagesToRender.map(page => {
            return (
              <Doc
                parentId={dndId}
                inAllowList={false}
                removeFromAllowList={() => {
                }}
                allPageMeta={allPagesMeta}
                doc={page}
                key={page.id}
                docCollection={docCollection}
              />
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};


export const FeedSidebarManageFeeds = ({ feeds, docCollection, className }: {
  feeds: Collection[],
  docCollection: DocCollection,
  className?: string
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const t = useI18n();

  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname,
    ),
  );
  const path = '/feed/manage';

  return (
    <Collapsible.Root
      open={!collapsed}
      className={className}
    >
      <SidebarMenuLinkItem
        className={draggableMenuItemStyles.draggableMenuItem}
        data-testid="feed-item"
        data-type="feed-list-item"
        active={currentPath === path}
        icon={<VscSettings />}
        to={path}
        onCollapsedChange={setCollapsed}
        linkComponent={WorkbenchLink}
        collapsed={feeds.length > 0 ? collapsed : undefined}
      >
        <span>{t['ai.readflow.rootAppSidebar.feeds.manage-feeds']()}</span>
      </SidebarMenuLinkItem>
      <Collapsible.Content className={styles.collapsibleContent}>
        <div className={styles.docsListContainer}>
          {feeds.map(feed => {
            return (
              <FeedSidebarNavItem
                key={feed.id}
                feed={feed}
                docCollection={docCollection}
              />
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};


export const FeedList = ({ docCollection }: FeedsListProps) => {
  const feeds = useLiveData(useService(FeedService).feeds$);
  const t = useI18n();
  const { node, handleCreateFeed } = useCreateFeed(docCollection);
  if (feeds.length === 0) {
    return (
      <>
        <CategoryDivider label={t['ai.readflow.rootAppSidebar.feeds']()}>
          <AddFeedButton node={node} onClick={handleCreateFeed} />
        </CategoryDivider>
        <div className={styles.emptyFeedWrapper}>
          <div className={styles.emptyFeedContent}>
            <div className={styles.emptyFeedIconWrapper}>
              <PiRss className={styles.emptyFeedIcon} />
            </div>
            <div
              data-testid="slider-bar-feed-null-description"
              className={styles.emptyFeedMessage}
            >
              {t['ai.readflow.feeds.empty.message']()}
            </div>
          </div>
          <Button className={styles.emptyFeedNewButton} onClick={handleCreateFeed}>
            {t['ai.readflow.feeds.empty.new-feed-button']()}
          </Button>
        </div>
      </>
    );
  }
  return (
    <>
      <CategoryDivider label={t['ai.readflow.rootAppSidebar.feeds']()}>
        <AddFeedButton node={node} onClick={handleCreateFeed} />
      </CategoryDivider>
      <div data-testid="feeds" className={styles.wrapper}>
        <FeedSidebarReadFeeds docCollection={docCollection} />
        <FeedSidebarManageFeeds feeds={feeds} docCollection={docCollection} />
      </div>
    </>
  );
};
