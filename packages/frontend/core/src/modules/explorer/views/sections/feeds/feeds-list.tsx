import { type DropTargetOptions, RssIcon } from '@affine/component';
import { IconButton } from '@affine/component/ui/button';
import { type CollectionMeta } from '@affine/core/components/page-list';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';
import { MenuLinkItem as SidebarMenuLinkItem } from '@affine/core/modules/app-sidebar/views';
import { ExplorerService } from '@affine/core/modules/explorer';
import { CollapsibleSection } from '@affine/core/modules/explorer/views/layouts/collapsible-section';
import { ExplorerDocNode } from '@affine/core/modules/explorer/views/nodes/doc';
import type { GenericExplorerNode } from '@affine/core/modules/explorer/views/nodes/types';
import {
  ExplorerTreeNode,
  type ExplorerTreeNodeDropEffect,
  ExplorerTreeRoot,
} from '@affine/core/modules/explorer/views/tree';
import { FeedsService } from '@affine/core/modules/feed/services/feeds-service';
import { NewFeedService } from '@affine/core/modules/feed-newly';
import type { Tag } from '@affine/core/modules/tag';
import {
  WorkbenchLink,
  WorkbenchService,
} from '@affine/core/modules/workbench';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { stopPropagation } from '@affine/core/utils';
import { useI18n } from '@affine/i18n';
import track, { mixpanel } from '@affine/track';
import { MoreHorizontalIcon, PlusIcon } from '@blocksuite/icons/rc';
import {
  GlobalContextService,
  useLiveData,
  useService,
  useServices,
} from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';

import { RootEmpty } from './empty';
import { useEditSubscription } from './feeds-hooks';
import { FeedsOperations } from './feeds-operations';
import { useExplorerFeedNodeOperations } from './operations';
import * as styles from './styles.css';

const unseenPath = '/feed/unseen';
const seenPath = '/feed/seen';

export const FeedsSidebarReadAll = () => {
  const t = useI18n();
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  return (
    <SidebarMenuLinkItem
      className={clsx(styles.menuItem)}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(unseenPath) || currentPath.includes(seenPath)
      }
      icon={<RssIcon />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.wemem.rootAppSidebar.feeds.all']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const FeedsSidebarReadFeeds = () => {
  const t = useI18n();
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  return (
    <SidebarMenuLinkItem
      className={clsx(styles.menuItem)}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(unseenPath) || currentPath.includes(seenPath)
      }
      icon={<FeedAvatar />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.wemem.rootAppSidebar.feeds.all']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const FeedsSidebarNavItem = ({
  feedMeta,
}: {
  feedMeta: CollectionMeta;
}) => {
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  const { node: editSubscriptionModal, handleEditSubscription } =
    useEditSubscription(feedMeta);

  const seenPath = `/feed/${feedMeta.id}/seen`;
  const unseenPath = `/feed/${feedMeta.id}/unseen`;

  return (
    <SidebarMenuLinkItem
      className={clsx(styles.menuItem)}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(seenPath) || currentPath.includes(unseenPath)
      }
      icon={<FeedAvatar image={feedMeta.feed?.icon} name={feedMeta.title} />}
      to={unseenPath}
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
          <FeedsOperations
            feedMeta={feedMeta}
            openRenameModal={handleEditSubscription}
          >
            <IconButton
              data-testid="tag-options"
              variant="plain"
              size="20"
              style={{ marginLeft: 4 }}
            >
              <MoreHorizontalIcon />
            </IconButton>
          </FeedsOperations>
          {editSubscriptionModal}
        </div>
      }
    >
      <span>{feedMeta.title}</span>
    </SidebarMenuLinkItem>
  );
};

export const FeedsSidebarReadNewsletter = () => {
  const t = useI18n();
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  return (
    <SidebarMenuLinkItem
      className={clsx(styles.menuItem)}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(unseenPath) || currentPath.includes(seenPath)
      }
      icon={<RssIcon />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.wemem.rootAppSidebar.feeds.newsletter']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const ExplorerFeeds = () => {
  const { newSubscriptionService, subscriptionService, explorerService } =
    useServices({
      NewSubscriptionService: NewFeedService,
      SubscriptionService: FeedsService,
      ExplorerService,
    });
  const handleOpenNewFeedModal = useCallback(() => {
    newSubscriptionService.subscribeFeed.show();
    mixpanel.track('NewOpened', {
      segment: 'navigation panel',
      control: 'new subscription button',
    });
  }, [newSubscriptionService]);
  const explorerSection = explorerService.sections.subscriptions;
  const collapsed = useLiveData(explorerSection.collapsed$);
  const subscriptions = useLiveData(subscriptionService.feeds$);
  const subscriptionsMetas = useMemo(() => {
    const collectionsList: CollectionMeta[] = subscriptions.map(collection => {
      return {
        ...collection,
        title: collection.name,
      };
    });
    return collectionsList;
  }, [subscriptions]);

  const t = useI18n();

  return (
    <CollapsibleSection
      name="subscriptions"
      headerClassName={styles.draggedOverHighlight}
      title={t['ai.wemem.rootAppSidebar.feeds']()}
      actions={
        <IconButton
          data-testid="explorer-bar-add-favorite-button"
          onClick={handleOpenNewFeedModal}
          size="16"
          tooltip={t['ai.wemem.feeds.empty.new-feed-button']()}
        >
          <PlusIcon />
        </IconButton>
      }
    >
      <ExplorerTreeRoot
        placeholder={<RootEmpty onActionClick={handleOpenNewFeedModal} />}
      >
        {subscriptionsMetas.length > 0 && !collapsed && (
          <div data-testid="subscriptions" className={styles.wrapper}>
            <FeedsSidebarReadFeeds />
          </div>
        )}
        {subscriptionsMetas.map(meta => {
          return (
            <ExplorerFeedNode key={meta.id} feedId={meta.id} feedMeta={meta} />
          );
        })}
      </ExplorerTreeRoot>
    </CollapsibleSection>
  );
};

export const ExplorerFeedNode = ({
  feedId,
  feedMeta,
  location,
  reorderable,
  operations: additionalOperations,
  dropEffect,
  canDrop,
  defaultRenaming,
}: {
  feedMeta: CollectionMeta;
  feedId: string;
  defaultRenaming?: boolean;
} & GenericExplorerNode) => {
  const t = useI18n();
  const { globalContextService } = useServices({
    GlobalContextService,
  });
  const active =
    useLiveData(globalContextService.globalContext.feedId.$) === feedId;
  const [collapsed, setCollapsed] = useState(true);
  const feedsService = useService(FeedsService);
  const unseenPath = `/feed/${feedMeta.id}/unseen`;
  const Icon = useCallback(
    ({ className }: { className?: string }) => {
      return (
        <div className={clsx(styles.feedIconContainer, className)}>
          <FeedAvatar image={feedMeta.feed?.icon} name={feedMeta.title} />
        </div>
      );
    },
    [feedMeta.feed?.icon, feedMeta.title]
  );

  const dndData = useMemo(() => {
    return {
      draggable: {
        entity: {
          type: 'subscription',
          id: feedId,
        },
        from: location,
      },
      dropTarget: {
        at: 'explorer:tag',
      },
    } satisfies AffineDNDData;
  }, [location, feedId]);

  const handleRename = useCallback(
    (newName: string) => {
      feedsService.updateFeed(feedMeta.id, collection => ({
        ...collection,
        name: newName,
      }));
      track.$.navigationPanel.feeds.renameFeed({
        control: 'button',
      });
    },
    [feedMeta.id, feedsService]
  );

  const handleDropEffectOnTag = useCallback<ExplorerTreeNodeDropEffect>(
    data => {
      if (data.treeInstruction?.type === 'make-child') {
        if (data.source.data.entity?.type === 'doc') {
          return 'link';
        }
      } else {
        return dropEffect?.(data);
      }
      return;
    },
    [dropEffect]
  );

  const handleCanDrop = useMemo<DropTargetOptions<AffineDNDData>['canDrop']>(
    () => args => {
      const entityType = args.source.data.entity?.type;
      return args.treeInstruction?.type !== 'make-child'
        ? ((typeof canDrop === 'function' ? canDrop(args) : canDrop) ?? true)
        : entityType === 'doc';
    },
    [canDrop]
  );

  const operations = useExplorerFeedNodeOperations(feedId);

  const finalOperations = useMemo(() => {
    if (additionalOperations) {
      return [...operations, ...additionalOperations];
    }
    return operations;
  }, [additionalOperations, operations]);

  return (
    <ExplorerTreeNode
      icon={Icon}
      name={feedMeta.name || t['Untitled']()}
      dndData={dndData}
      renameable
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      to={unseenPath}
      active={active}
      defaultRenaming={defaultRenaming}
      reorderable={reorderable}
      onRename={handleRename}
      canDrop={handleCanDrop}
      operations={finalOperations}
      dropEffect={handleDropEffectOnTag}
      data-testid={`explorer-tag-${feedId}`}
    ></ExplorerTreeNode>
  );
};

/**
 * the `tag.pageIds$` has a performance issue,
 * so we split the tag node children into a separate component,
 * so it won't be rendered when the tag node is collapsed.
 */
export const ExplorerTagNodeDocs = ({ tag }: { tag: Tag }) => {
  const tagDocIds = useLiveData(tag.pageIds$);

  return tagDocIds.map(docId => (
    <ExplorerDocNode
      key={docId}
      docId={docId}
      reorderable={false}
      location={{
        at: 'explorer:tags:docs',
      }}
    />
  ));
};
