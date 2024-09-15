import { type DropTargetOptions } from '@affine/component';
import { IconButton } from '@affine/component/ui/button';
import { type CollectionMeta } from '@affine/core/components/page-list';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';
import { mixpanel, track } from '@affine/core/mixpanel';
import { ExplorerService } from '@affine/core/modules/explorer';
import { CollapsibleSection } from '@affine/core/modules/explorer/views/layouts/collapsible-section';
import { ExplorerDocNode } from '@affine/core/modules/explorer/views/nodes/doc';
import { useExplorerTagNodeOperations } from '@affine/core/modules/explorer/views/nodes/tag/operations';
import type { GenericExplorerNode } from '@affine/core/modules/explorer/views/nodes/types';
import {
  ExplorerTreeNode,
  type ExplorerTreeNodeDropEffect,
  ExplorerTreeRoot,
} from '@affine/core/modules/explorer/views/tree';
import { SubscriptionService } from '@affine/core/modules/subscription/services/subscription-service';
import { NewSubscriptionService } from '@affine/core/modules/subscription/subscribe-feed/services/subscriptions-service';
import type { Tag } from '@affine/core/modules/tag';
import { WorkbenchLink } from '@affine/core/modules/workbench';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { stopPropagation } from '@affine/core/utils';
import { useI18n } from '@affine/i18n';
import { MoreHorizontalIcon, PlusIcon } from '@blocksuite/icons/rc';
import {
  GlobalContextService,
  useLiveData,
  useService,
  useServices,
} from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { VscInbox, VscMail } from 'react-icons/vsc';

import { WorkbenchService } from '../../../../modules/workbench';
import { MenuLinkItem as SidebarMenuLinkItem } from '../../../app-sidebar';
import { RootEmpty } from './empty';
import * as styles from './styles.css';
import { useEditSubscription } from './subscription-hooks';
import { SubscriptionOperations } from './subscription-operations';

const unseenPath = `/subscription/unseen`;
const seenPath = `/subscription/seen`;

export const FeedSidebarReadAll = () => {
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
      icon={<VscInbox />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.wemem.rootAppSidebar.feeds.all']()}</span>
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

export const SubscriptionSidebarNavItem = ({
  subscriptionMeta,
}: {
  subscriptionMeta: CollectionMeta;
}) => {
  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  const { node: editSubscriptionModal, handleEditSubscription } =
    useEditSubscription(subscriptionMeta);

  const seenPath = `/subscription/${subscriptionMeta.id}/seen`;
  const unseenPath = `/subscription/${subscriptionMeta.id}/unseen`;

  return (
    <SidebarMenuLinkItem
      className={clsx(styles.menuItem)}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(seenPath) || currentPath.includes(unseenPath)
      }
      icon={
        <FeedAvatar
          image={subscriptionMeta.subscription?.icon}
          name={subscriptionMeta.title}
        />
      }
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
          <SubscriptionOperations
            subscriptionMeta={subscriptionMeta}
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
          </SubscriptionOperations>
          {editSubscriptionModal}
        </div>
      }
    >
      <span>{subscriptionMeta.title}</span>
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
      className={clsx(styles.menuItem)}
      data-testid="feed-docs-unseen"
      data-type="feed-docs-unseen"
      active={
        currentPath.includes(unseenPath) || currentPath.includes(seenPath)
      }
      icon={<VscMail />}
      to={unseenPath}
      linkComponent={WorkbenchLink}
    >
      <span>{t['ai.wemem.rootAppSidebar.feeds.newsletter']()}</span>
    </SidebarMenuLinkItem>
  );
};

export const ExplorerSubscriptions = () => {
  const { newSubscriptionService, subscriptionService, explorerService } =
    useServices({
      NewSubscriptionService,
      SubscriptionService,
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
  const subscriptions = useLiveData(subscriptionService.subscriptions$);
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
      <ExplorerTreeRoot placeholder={<RootEmpty />}>
        {subscriptionsMetas.length > 0 && !collapsed && (
          <div data-testid="subscriptions" className={styles.wrapper}>
            <FeedSidebarReadFeeds />
          </div>
        )}
        {subscriptionsMetas.map(meta => {
          return (
            <ExplorerSubscriptionNode
              key={meta.id}
              subscriptionId={meta.id}
              subscriptionMeta={meta}
            />
          );
        })}
      </ExplorerTreeRoot>
    </CollapsibleSection>
  );
};

export const ExplorerSubscriptionNode = ({
  subscriptionId,
  subscriptionMeta,
  location,
  reorderable,
  operations: additionalOperations,
  dropEffect,
  canDrop,
  defaultRenaming,
}: {
  subscriptionMeta: CollectionMeta;
  subscriptionId: string;
  defaultRenaming?: boolean;
} & GenericExplorerNode) => {
  const t = useI18n();
  const { globalContextService } = useServices({
    GlobalContextService,
  });
  const active =
    useLiveData(globalContextService.globalContext.subscriptionId.$) ===
    subscriptionId;
  const [collapsed, setCollapsed] = useState(true);
  const subscriptionService = useService(SubscriptionService);
  const unseenPath = `/subscription/${subscriptionMeta.id}/unseen`;
  const Icon = useCallback(
    ({ className }: { className?: string }) => {
      return (
        <div className={clsx(styles.subscriptionIconContainer, className)}>
          <FeedAvatar
            image={subscriptionMeta.subscription?.icon}
            name={subscriptionMeta.title}
          />
        </div>
      );
    },
    [subscriptionMeta.subscription?.icon, subscriptionMeta.title]
  );

  const dndData = useMemo(() => {
    return {
      draggable: {
        entity: {
          type: 'subscription',
          id: subscriptionId,
        },
        from: location,
      },
      dropTarget: {
        at: 'explorer:tag',
      },
    } satisfies AffineDNDData;
  }, [location, subscriptionId]);

  const handleRename = useCallback(
    (newName: string) => {
      subscriptionService.updateSubscription(
        subscriptionMeta.id,
        collection => ({
          ...collection,
          name: newName,
        })
      );
      track.$.navigationPanel.organize.renameOrganizeItem({
        type: 'subscription',
      });
    },
    [subscriptionMeta.id, subscriptionService]
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
        ? (typeof canDrop === 'function' ? canDrop(args) : canDrop) ?? true
        : entityType === 'doc';
    },
    [canDrop]
  );

  const operations = useExplorerTagNodeOperations(
    subscriptionId,
    useMemo(
      () => ({
        openNodeCollapsed: () => setCollapsed(false),
      }),
      []
    )
  );

  const finalOperations = useMemo(() => {
    if (additionalOperations) {
      return [...operations, ...additionalOperations];
    }
    return operations;
  }, [additionalOperations, operations]);

  return (
    <ExplorerTreeNode
      icon={Icon}
      name={subscriptionMeta.name || t['Untitled']()}
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
      data-testid={`explorer-tag-${subscriptionId}`}
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
