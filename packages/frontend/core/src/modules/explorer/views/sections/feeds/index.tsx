import {
  type DropTargetDropEvent,
  type DropTargetOptions,
  IconButton,
  toast,
} from '@affine/component';
import { ExplorerTreeRoot } from '@affine/core/modules/explorer/views/tree';
import { type FeedNode, FeedNodeType } from '@affine/core/modules/feeds';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { useI18n } from '@affine/i18n';
import { mixpanel, track } from '@affine/track';
import { FolderIcon, PlusIcon } from '@blocksuite/icons/rc';
import { useLiveData, useServices } from '@toeverything/infra';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ExplorerService } from '../../../services/explorer';
import { CollapsibleSection } from '../../layouts/collapsible-section';
import { calcLocation, ExplorerFeedsNode } from '../../nodes/feed';
import { organizeChildrenDropEffect } from './dnd';
import { RootEmpty } from './empty';

export const ExplorerFeeds = () => {
  const { feedsService, explorerService } = useServices({
    FeedsService,
    ExplorerService,
  });
  const explorerSection = explorerService.sections.feeds;
  const collapsed = useLiveData(explorerSection.collapsed$);
  const [newFolderId, setNewFolderId] = useState<string | null>(null);

  const t = useI18n();

  const folderTree = feedsService.feedTree;
  const rootFolder = folderTree.rootFolder;

  const children = useLiveData(rootFolder.sortedChildren$);
  const isLoading = useLiveData(folderTree.isLoading$);

  const handleOpenSearchFeedModal = useCallback(() => {
    feedsService.searchModal.show();
    mixpanel.track('NewOpened', {
      segment: 'navigation panel',
      control: 'new subscription button',
    });
  }, [feedsService]);

  const handleCreateFolder = useCallback(() => {
    const newFolderId = rootFolder.createFolder(
      t['com.affine.rootAppSidebar.organize.new-folders'](),
      rootFolder.indexAt('before')
    );

    track.$.navigationPanel.feeds.createFeedsItem({
      type: FeedNodeType.Folder,
    });
    setNewFolderId(newFolderId);
    explorerSection.setCollapsed(false);
    return newFolderId;
  }, [explorerSection, rootFolder, t]);

  const handleOnChildrenDrop = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>, node?: FeedNode) => {
      if (!node || !node.id) {
        return; // never happens
      }
      if (
        data.treeInstruction?.type === 'reorder-above' ||
        data.treeInstruction?.type === 'reorder-below'
      ) {
        const at =
          data.treeInstruction?.type === 'reorder-below' ? 'after' : 'before';
        if (
          data.source.data.entity?.type === FeedNodeType.Folder ||
          data.source.data.entity?.type === FeedNodeType.RSS
        ) {
          rootFolder.moveHere(
            data.source.data.entity?.id ?? '',
            rootFolder.indexAt(at, node.id)
          );
          track.$.navigationPanel.feeds.moveFeedNode({
            type: data.source.data.entity?.type,
          });
        } else {
          toast(
            t['ai.wemem.rootAppSidebar.feeds.root-folder-and-feeds-only']()
          );
        }
      } else {
        return; // not supported
      }
    },
    [rootFolder, t]
  );

  const handleChildrenCanDrop = useMemo<
    DropTargetOptions<AffineDNDData>['canDrop']
  >(
    () => args =>
      [FeedNodeType.Folder, FeedNodeType.RSS].includes(
        args.source.data.entity?.type as FeedNodeType
      ),
    []
  );

  useEffect(() => {
    if (collapsed) setNewFolderId(null); // reset new folder id to clear the renaming state
  }, [collapsed]);

  return (
    <CollapsibleSection
      name="feeds"
      title={t['ai.wemem.rootAppSidebar.feeds']()}
      actions={
        <>
          <IconButton
            data-testid="explorer-bar-add-feeds-button"
            onClick={handleOpenSearchFeedModal}
            size="16"
            tooltip={t['ai.wemem.feeds.empty.new-feed-button']()}
          >
            <PlusIcon />
          </IconButton>
          <IconButton
            data-testid="explorer-bar-add-feeds-folder-button"
            onClick={handleCreateFolder}
            size="16"
            tooltip={t['ai.wemem.rootAppSidebar.feeds.create-folder']()}
          >
            <FolderIcon />
          </IconButton>
        </>
      }
    >
      <ExplorerTreeRoot
        placeholder={
          <RootEmpty
            onClickCreate={handleOpenSearchFeedModal}
            isLoading={isLoading}
          />
        }
      >
        {children.map(child => (
          <ExplorerFeedsNode
            key={child.id}
            nodeId={child.id as string}
            defaultRenaming={child.id === newFolderId}
            onDrop={handleOnChildrenDrop}
            dropEffect={organizeChildrenDropEffect}
            canDrop={handleChildrenCanDrop}
            reorderable
            location={calcLocation(child)}
          />
        ))}
      </ExplorerTreeRoot>
    </CollapsibleSection>
  );
};
