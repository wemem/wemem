import { toast } from '@affine/component';
import { RenameModal } from '@affine/component/rename-modal';
import { IconButton } from '@affine/component/ui/button';
import {
  FeedOperations,
  filterPage,
  RssIcon,
  stopPropagation,
} from '@affine/core/components/page-list';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';
import { Doc } from '@affine/core/components/pure/workspace-slider-bar/collections';
import { SubscribeButton } from '@affine/core/components/pure/workspace-slider-bar/subscriptions/subscribe-button';
import { useAllPageListConfig } from '@affine/core/hooks/affine/use-all-page-list-config';
import { getDNDId } from '@affine/core/hooks/affine/use-global-dnd-helper';
import { useBlockSuiteDocMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import { SubscriptionService } from '@affine/core/modules/feed/services/subscription-service';
import { FavoriteItemsAdapter } from '@affine/core/modules/properties';
import { WorkbenchLink } from '@affine/core/modules/workbench';
import { mixpanel } from '@affine/core/utils';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { MoreHorizontalIcon } from '@blocksuite/icons/rc';
import type { DocCollection } from '@blocksuite/store';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { VscInbox, VscMail, VscSettings } from 'react-icons/vsc';

import { SubscriptionsService } from '../../../../modules/feed/subscribe-feed';
import { WorkbenchService } from '../../../../modules/workbench';
import {
  CategoryDivider,
  MenuLinkItem as SidebarMenuLinkItem,
} from '../../../app-sidebar';
import * as draggableMenuItemStyles from '../components/draggable-menu-item.css';
import type { SubscriptionsListProps } from '../index';
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
  const feedService = useService(SubscriptionService);
  const favAdapter = useService(FavoriteItemsAdapter);
  const favourites = useLiveData(favAdapter.favorites$);
  const t = useI18n();
  const dndId = getDNDId('sidebar-collections', 'collection', feed.id);

  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  const path = `/subscription/${feed.id}`;

  const onRename = useCallback(
    (name: string) => {
      feedService.updateSubscription(feed.id, () => ({
        ...feed,
        name,
      }));
      toast(t['com.affine.toastMessage.rename']());
    },
    [feed, feedService, t]
  );
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const allPagesMeta = useMemo(
    () => Object.fromEntries(pages.map(v => [v.id, v])),
    [pages]
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
    <Collapsible.Root open={!collapsed} className={className}>
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
            <FeedOperations feed={feed} openRenameModal={handleOpen}>
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
                removeFromAllowList={() => {}}
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

const unseenPath = `/subscription/seen/false`;
const seenPath = `/subscription/seen/true`;

export const FeedSidebarReadAll = () => {
  const t = useI18n();
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  return (
    <SidebarMenuLinkItem
      className={clsx(
        draggableMenuItemStyles.draggableMenuItem,
        styles.menuItem
      )}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(unseenPath) || currentPath.includes(seenPath)
      }
      icon={<VscInbox />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.readflow.rootAppSidebar.feeds.all']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const FeedSidebarReadFeeds = () => {
  const t = useI18n();
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  return (
    <SidebarMenuLinkItem
      className={clsx(
        draggableMenuItemStyles.draggableMenuItem,
        styles.menuItem
      )}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(unseenPath) || currentPath.includes(seenPath)
      }
      icon={<RssIcon />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.readflow.rootAppSidebar.feeds.read-feeds']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const FeedSidebarReadNewsletter = () => {
  const t = useI18n();
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  return (
    <SidebarMenuLinkItem
      className={clsx(
        draggableMenuItemStyles.draggableMenuItem,
        styles.menuItem
      )}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(unseenPath) || currentPath.includes(seenPath)
      }
      icon={<VscMail />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.readflow.rootAppSidebar.feeds.newsletter']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const ManageSubscriptions = () => {
  const t = useI18n();

  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  const path = '/subscription/manage';

  return (
    <SidebarMenuLinkItem
      className={clsx(
        draggableMenuItemStyles.draggableMenuItem,
        styles.menuItem
      )}
      data-testid="subscription-item"
      data-type="subscription-list-item"
      active={currentPath === path}
      icon={<VscSettings />}
      to={path}
      linkComponent={WorkbenchLink}
      collapsed={undefined}
    >
      <span>{t['ai.readflow.rootAppSidebar.feeds.manage-feeds']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const SubscriptionsList = ({
  docCollection,
}: SubscriptionsListProps) => {
  const subscriptions = useLiveData(
    useService(SubscriptionService).subscriptions$
  );
  const t = useI18n();
  const subscribeFeed = useService(SubscriptionsService).subscribeFeed;
  const handleOpenNewFeedModal = useCallback(() => {
    subscribeFeed.show();
    mixpanel.track('NewOpened', {
      segment: 'navigation panel',
      control: 'new subscription button',
    });
  }, [subscribeFeed]);

  if (subscriptions.length === 0) {
    return (
      <CategoryDivider label={t['ai.readflow.rootAppSidebar.feeds']()}>
        <SubscribeButton onClick={handleOpenNewFeedModal} />
      </CategoryDivider>
    );
  }
  return (
    <>
      <CategoryDivider label={t['ai.readflow.rootAppSidebar.feeds']()}>
        <SubscribeButton onClick={handleOpenNewFeedModal} />
      </CategoryDivider>
      <div data-testid="subscriptions" className={styles.wrapper}>
        <FeedSidebarReadAll />
        <FeedSidebarReadFeeds />
        <FeedSidebarReadNewsletter />
        <ManageSubscriptions />
      </div>
    </>
  );
};
