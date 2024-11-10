import {
  AnimatedFolderIcon,
  type DropTargetDropEvent,
  type DropTargetOptions,
  IconButton,
  MenuItem,
  MenuSeparator,
  notify,
  RssIcon,
} from '@affine/component';
import { FeedAvatar } from '@affine/component';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import {
  FeedExplorerType,
  type FeedNode,
  FeedNodeType,
} from '@affine/core/modules/feeds';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { useI18n } from '@affine/i18n';
import { track } from '@affine/track';
import {
  DeleteIcon,
  FolderIcon,
  PlusIcon,
  RemoveFolderIcon,
} from '@blocksuite/icons/rc';
import {
  FeatureFlagService,
  GlobalContextService,
  useLiveData,
  useServices,
} from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';

import { ExplorerTreeNode, type ExplorerTreeNodeDropEffect } from '../../tree';
import type { ExplorerTreeNodeIcon } from '../../tree/node';
import type { NodeOperation } from '../../tree/types';
import type { GenericExplorerNode } from '../types';
import { FolderEmpty } from './empty';
import {
  FavoriteFolderOperation,
  useExplorerRSSNodeOperations,
} from './operations';
import * as styles from './styles.css';
import { UnreadBadge } from './unread-bedge';

export const calcLocation = (node: FeedNode) => {
  let at: FeedExplorerType | undefined;
  if (node.type$.value === FeedNodeType.Folder) {
    at = FeedExplorerType.Folder;
  } else if (node.type$.value === FeedNodeType.RSS) {
    at = FeedExplorerType.RSS;
  } else {
    throw new Error('Invalid node type');
  }
  return {
    at,
    nodeId: node.id as string,
  };
};

export const ExplorerFeedsNode = ({
  nodeId,
  onDrop,
  defaultRenaming,
  operations,
  location,
  dropEffect,
  canDrop,
  reorderable,
}: {
  defaultRenaming?: boolean;
  nodeId: string;
  onDrop?: (data: DropTargetDropEvent<AffineDNDData>, node: FeedNode) => void;
  operations?:
    | NodeOperation[]
    | ((type: string, node: FeedNode) => NodeOperation[]);
} & Omit<GenericExplorerNode, 'operations'>) => {
  const { feedsService } = useServices({
    FeedsService,
  });
  const node = useLiveData(feedsService.feedTree.nodeById$(nodeId));
  const type = useLiveData(node?.type$);
  const handleDrop = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>) => {
      if (!node) {
        return;
      }
      onDrop?.(data, node);
    },
    [node, onDrop]
  );
  const additionalOperations = useMemo(() => {
    if (!type || !node) {
      return;
    }
    if (typeof operations === 'function') {
      return operations(type, node);
    }
    return operations;
  }, [node, operations, type]);

  if (!node) {
    return;
  }

  if (type === FeedNodeType.Folder) {
    return (
      <ExplorerFeedFolderNode
        nodeId={nodeId}
        onDrop={handleDrop}
        defaultRenaming={defaultRenaming}
        operations={additionalOperations}
        dropEffect={dropEffect}
        reorderable={reorderable}
        canDrop={canDrop}
      />
    );
  } else if (type === FeedNodeType.RSS) {
    return (
      node && (
        <ExplorerFeedRSSNode
          nodeId={nodeId}
          location={location}
          onDrop={handleDrop}
          reorderable={reorderable}
          canDrop={canDrop}
          dropEffect={dropEffect}
          operations={additionalOperations}
        />
      )
    );
  }
  return;
};

// Define outside the `ExplorerFolderNodeFolder` to avoid re-render(the close animation won't play)
const ExplorerFolderIcon: ExplorerTreeNodeIcon = ({
  collapsed,
  className,
  draggedOver,
  treeInstruction,
}) => (
  <AnimatedFolderIcon
    className={className}
    open={
      !collapsed || (!!draggedOver && treeInstruction?.type === 'make-child')
    }
  />
);

export const ExplorerFeedFolderNode = ({
  nodeId,
  onDrop,
  defaultRenaming,
  location,
  operations: additionalOperations,
  canDrop,
  dropEffect,
  reorderable,
}: {
  defaultRenaming?: boolean;
  nodeId: string;
} & GenericExplorerNode) => {
  const t = useI18n();
  const { featureFlagService, feedsService } = useServices({
    FeatureFlagService,
    FeedsService,
  });

  const node = useLiveData(feedsService.feedTree.nodeById$(nodeId));
  const name = useLiveData(node?.name$);
  const enableEmojiIcon = useLiveData(
    featureFlagService.flags.enable_emoji_folder_icon.$
  );
  const [collapsed, setCollapsed] = useState(true);
  const [newFolderId, setNewFolderId] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    if (!node) {
      return;
    }
    node.delete();
    track.$.navigationPanel.organize.deleteOrganizeItem({
      type: 'folder',
    });
    notify.success({
      title: t['com.affine.rootAppSidebar.organize.delete.notify-title']({
        name,
      }),
      message: t['com.affine.rootAppSidebar.organize.delete.notify-message'](),
    });
  }, [name, node, t]);

  const children = useLiveData(node?.sortedChildren$);

  const dndData = useMemo(() => {
    if (!node) {
      return;
    }
    return {
      draggable: {
        entity: {
          type: FeedNodeType.Folder,
          id: node.id as string,
        },
        from: location,
      },
      dropTarget: {
        at: FeedExplorerType.Folder,
      },
    } satisfies AffineDNDData;
  }, [location, node]);

  const handleRename = useCallback(
    (newName: string) => {
      if (!node) {
        return;
      }
      node.rename(newName);
      track.$.navigationPanel.feeds.renameFeedFolder();
    },
    [node]
  );

  const handleDropOnFolder = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>) => {
      if (!node) {
        return;
      }
      if (data.treeInstruction?.type === 'make-child') {
        if (data.source.data.entity?.type === FeedNodeType.Folder) {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          node.moveHere(data.source.data.entity.id, node.indexAt('before'));
          track.$.navigationPanel.feeds.moveFeedNode({
            type: FeedNodeType.Folder,
          });
        } else if (data.source.data.entity?.type === FeedNodeType.RSS) {
          node.moveHere(data.source.data.entity.id, node.indexAt('before'));
          track.$.navigationPanel.feeds.moveFeedNode({
            type: FeedNodeType.RSS,
          });
        } else if (data.source.data.from?.at === FeedExplorerType.Folder) {
          node.moveHere(data.source.data.from.nodeId, node.indexAt('before'));
        }
      } else {
        onDrop?.(data);
      }
    },
    [node, onDrop]
  );

  const handleDropEffect = useCallback<ExplorerTreeNodeDropEffect>(
    data => {
      if (!node) {
        return;
      }
      if (data.treeInstruction?.type === 'make-child') {
        if (data.source.data.entity?.type === FeedNodeType.Folder) {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          return 'move';
        } else if (data.source.data.from?.at === FeedExplorerType.Folder) {
          return 'move';
        } else if (data.source.data.entity?.type === FeedNodeType.RSS) {
          return 'move';
        }
      } else {
        return dropEffect?.(data);
      }
      return;
    },
    [dropEffect, node]
  );

  const handleDropOnChildren = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>, dropAtNode?: FeedNode) => {
      if (!node || !dropAtNode || !dropAtNode.id) {
        return;
      }
      if (
        data.treeInstruction?.type === 'reorder-above' ||
        data.treeInstruction?.type === 'reorder-below'
      ) {
        const at =
          data.treeInstruction?.type === 'reorder-below' ? 'after' : 'before';
        if (data.source.data.entity?.type === FeedNodeType.Folder) {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          node.moveHere(
            data.source.data.entity.id,
            node.indexAt(at, dropAtNode.id)
          );
          track.$.navigationPanel.organize.moveOrganizeItem({
            type: FeedNodeType.Folder,
          });
        } else if (data.source.data.entity?.type === FeedNodeType.RSS) {
          node.moveHere(
            data.source.data.entity.id,
            node.indexAt(at, dropAtNode.id)
          );
          track.$.navigationPanel.feeds.moveFeedNode({
            type: data.source.data.entity?.type,
          });
        }
      } else if (data.treeInstruction?.type === 'reparent') {
        const currentLevel = data.treeInstruction.currentLevel;
        const desiredLevel = data.treeInstruction.desiredLevel;
        if (currentLevel === desiredLevel + 1) {
          onDrop?.({
            ...data,
            treeInstruction: {
              type: 'reorder-below',
              currentLevel,
              indentPerLevel: data.treeInstruction.indentPerLevel,
            },
          });
          return;
        } else {
          onDrop?.({
            ...data,
            treeInstruction: {
              ...data.treeInstruction,
              currentLevel: currentLevel - 1,
            },
          });
        }
      }
    },
    [node, onDrop]
  );

  const handleDropEffectOnChildren = useCallback<ExplorerTreeNodeDropEffect>(
    data => {
      if (!node) {
        return;
      }
      if (
        data.treeInstruction?.type === 'reorder-above' ||
        data.treeInstruction?.type === 'reorder-below'
      ) {
        if (data.source.data.entity?.type === FeedNodeType.Folder) {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          return 'move';
        } else if (data.source.data.from?.at === FeedExplorerType.Folder) {
          return 'move';
        } else if (data.source.data.entity?.type === FeedNodeType.RSS) {
          return 'move';
        }
      } else if (data.treeInstruction?.type === 'reparent') {
        const currentLevel = data.treeInstruction.currentLevel;
        const desiredLevel = data.treeInstruction.desiredLevel;
        if (currentLevel === desiredLevel + 1) {
          dropEffect?.({
            ...data,
            treeInstruction: {
              type: 'reorder-below',
              currentLevel,
              indentPerLevel: data.treeInstruction.indentPerLevel,
            },
          });
          return;
        } else {
          dropEffect?.({
            ...data,
            treeInstruction: {
              ...data.treeInstruction,
              currentLevel: currentLevel - 1,
            },
          });
        }
      }
      return;
    },
    [dropEffect, node]
  );

  const handleCanDrop = useMemo<DropTargetOptions<AffineDNDData>['canDrop']>(
    () => args => {
      if (!node) {
        return false;
      }
      const entityType = args.source.data.entity?.type;
      if (args.treeInstruction && args.treeInstruction?.type !== 'make-child') {
        return (
          (typeof canDrop === 'function' ? canDrop(args) : canDrop) ?? true
        );
      }

      if (args.source.data.entity?.type === FeedNodeType.Folder) {
        if (
          node.id === args.source.data.entity.id ||
          node.beChildOf(args.source.data.entity.id)
        ) {
          return false;
        }
        return true;
      } else if (args.source.data.from?.at === FeedExplorerType.Folder) {
        return true;
      } else if (entityType === FeedNodeType.RSS) {
        return true;
      }
      return false;
    },
    [canDrop, node]
  );

  const handleChildrenCanDrop = useMemo<
    DropTargetOptions<AffineDNDData>['canDrop']
  >(
    () => args => {
      if (!node) {
        return false;
      }
      const entityType = args.source.data.entity?.type;

      if (args.source.data.entity?.type === FeedNodeType.Folder) {
        if (
          node.id === args.source.data.entity.id ||
          node.beChildOf(args.source.data.entity.id)
        ) {
          return false;
        }
        return true;
      } else if (args.source.data.from?.at === FeedExplorerType.Folder) {
        return true;
      } else if (entityType === FeedNodeType.RSS) {
        return true;
      }
      return false;
    },
    [node]
  );

  const handleNewFeed = useCallback(() => {
    if (!node) {
      return;
    }
    feedsService.searchModal.show({
      folderId: node.id as string,
      folderName: name as string,
    });
  }, [node, feedsService.searchModal, name]);

  const handleCreateSubfolder = useCallback(() => {
    if (!node) {
      return;
    }
    const newFolderId = node.createFolder(
      t['com.affine.rootAppSidebar.organize.new-folders'](),
      node.indexAt('before')
    );
    track.$.navigationPanel.feeds.createFeedsItem({
      type: FeedNodeType.Folder,
    });
    setCollapsed(false);
    setNewFolderId(newFolderId);
  }, [node, t]);

  const folderOperations = useMemo(() => {
    return [
      {
        index: 0,
        inline: true,
        view: (
          <IconButton
            size="16"
            onClick={handleNewFeed}
            tooltip={t['ai.wemem.rootAppSidebar.feeds.action']()}
          >
            <PlusIcon />
          </IconButton>
        ),
      },
      {
        index: 100,
        view: (
          <MenuItem prefixIcon={<RssIcon />} onClick={handleNewFeed}>
            {t['ai.wemem.rootAppSidebar.feeds.action']()}
          </MenuItem>
        ),
      },
      {
        index: 101,
        view: (
          <MenuItem prefixIcon={<FolderIcon />} onClick={handleCreateSubfolder}>
            {t['com.affine.rootAppSidebar.organize.folder.create-subfolder']()}
          </MenuItem>
        ),
      },

      {
        index: 200,
        view: node?.id ? <FavoriteFolderOperation id={node.id} /> : null,
      },
      {
        index: 9999,
        view: <MenuSeparator key="menu-separator" />,
      },
      {
        index: 10000,
        view: (
          <MenuItem
            type={'danger'}
            prefixIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            {t['com.affine.rootAppSidebar.organize.delete']()}
          </MenuItem>
        ),
      },
    ];
  }, [handleCreateSubfolder, handleDelete, handleNewFeed, node, t]);

  const finalOperations = useMemo(() => {
    if (additionalOperations) {
      return [...additionalOperations, ...folderOperations];
    }
    return folderOperations;
  }, [additionalOperations, folderOperations]);

  const childrenOperations = useCallback(
    // eslint-disable-next-line @typescript-eslint/ban-types
    (type: string, node: FeedNode) => {
      if (type === 'doc' || type === 'collection' || type === 'tag') {
        return [
          {
            index: 999,
            view: (
              <MenuItem
                type={'danger'}
                prefixIcon={<RemoveFolderIcon />}
                data-event-props="$.navigationPanel.organize.deleteOrganizeItem"
                data-event-args-type={node.type$.value}
                onClick={() => node.delete()}
              >
                {t['com.affine.rootAppSidebar.organize.delete-from-folder']()}
              </MenuItem>
            ),
          },
        ] satisfies NodeOperation[];
      }
      return [];
    },
    [t]
  );

  const handleCollapsedChange = useCallback((collapsed: boolean) => {
    if (collapsed) {
      setNewFolderId(null); // reset new folder id to clear the renaming state
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, []);

  if (!node) {
    return null;
  }

  return (
    <ExplorerTreeNode
      icon={ExplorerFolderIcon}
      name={name}
      dndData={dndData}
      onDrop={handleDropOnFolder}
      defaultRenaming={defaultRenaming}
      renameable
      extractEmojiAsIcon={enableEmojiIcon}
      reorderable={reorderable}
      collapsed={collapsed}
      setCollapsed={handleCollapsedChange}
      onRename={handleRename}
      operations={finalOperations}
      canDrop={handleCanDrop}
      childrenPlaceholder={<FolderEmpty canDrop={handleCanDrop} />}
      dropEffect={handleDropEffect}
      data-testid={`explorer-folder-${node?.id}`}
      postfix={<UnreadBadge node={node} />}
    >
      {children?.map(child => (
        <ExplorerFeedsNode
          key={child.id}
          nodeId={child.id as string}
          defaultRenaming={child.id === newFolderId}
          onDrop={handleDropOnChildren}
          operations={childrenOperations}
          dropEffect={handleDropEffectOnChildren}
          canDrop={handleChildrenCanDrop}
          reorderable
          location={calcLocation(child)}
        />
      ))}
    </ExplorerTreeNode>
  );
};

export const ExplorerFeedRSSNode = ({
  nodeId,
  location,
  reorderable,
  operations: additionalOperations,
}: {
  nodeId: string;
  isLinked?: boolean;
} & GenericExplorerNode) => {
  const { feedsService, globalContextService, featureFlagService } =
    useServices({
      FeedsService,
      GlobalContextService,
      FeatureFlagService,
    });
  const node = useLiveData(feedsService.feedTree.nodeById$(nodeId));
  const enableEmojiIcon = useLiveData(
    featureFlagService.flags.enable_emoji_folder_icon.$
  );

  const icon = useLiveData(node?.icon$);
  const name = useLiveData(node?.name$);
  const allPath = `/feed/${nodeId}/all`;

  const active =
    useLiveData(globalContextService.globalContext.feedId.$) === nodeId;
  const [collapsed, setCollapsed] = useState(true);

  const DocIcon = useCallback(
    ({ className }: { className?: string }) => {
      return (
        <div className={clsx(styles.feedIconContainer, className)}>
          <FeedAvatar image={icon} name={name} />
        </div>
      );
    },
    [icon, name]
  );

  const Icon = useCallback(
    ({ className }: { className?: string }) => {
      return <DocIcon className={className} />;
    },
    [DocIcon]
  );

  const dndData = useMemo(() => {
    return {
      draggable: {
        entity: {
          type: FeedNodeType.RSS,
          id: nodeId as string,
        },
        from: location,
      },
      dropTarget: {
        at: FeedExplorerType.RSS,
      },
    } satisfies AffineDNDData;
  }, [nodeId, location]);

  const handleRename = useAsyncCallback(
    async (newName: string) => {
      if (!node) {
        return;
      }
      node.rename(newName);
      track.$.navigationPanel.feeds.renameFeed();
    },
    [node]
  );

  const operations = useExplorerRSSNodeOperations(
    node,
    useMemo(
      () => ({
        openInfoModal: () => feedsService.infoModal.open(nodeId as string),
        openNodeCollapsed: () => setCollapsed(false),
        removeNode: () => node?.delete(),
      }),
      [nodeId, feedsService.infoModal, node]
    )
  );

  const finalOperations = useMemo(() => {
    if (additionalOperations) {
      return [...operations, ...additionalOperations];
    }
    return operations;
  }, [additionalOperations, operations]);

  if (!node) {
    return null;
  }

  return (
    <ExplorerTreeNode
      icon={Icon}
      name={name}
      dndData={dndData}
      renameable
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      to={allPath}
      active={active}
      reorderable={reorderable}
      extractEmojiAsIcon={enableEmojiIcon}
      onRename={handleRename}
      operations={finalOperations}
      data-testid={`explorer-feed-${node.id}`}
      postfix={<UnreadBadge node={node} />}
    />
  );
};
