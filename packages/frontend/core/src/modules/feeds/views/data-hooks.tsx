import { FeedAvatar, toast } from '@affine/component';
import { type CommandCategory } from '@affine/core/commands';
import { useNavigateHelper } from '@affine/core/components/hooks/use-navigate-helper';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import type { SearchSubscriptionsQuery } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { atom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { FeedSearchCommandRegistry } from '../commands';
import { filterSortAndGroupCommands } from './filter-commands';
import type { FeedSearchCommand } from './types';

export type FeedRecord = NonNullable<
  SearchSubscriptionsQuery['searchSubscriptions']
>[number];
export const cmdkValueAtom = atom('');

const feedRecordToCommand = (
  category: CommandCategory,
  feedRecord: FeedRecord,
  run: () => void
): FeedSearchCommand => {
  const commandLabel = {
    title: feedRecord.name,
    subTitle: feedRecord.url || '',
  };

  const id = category + '.' + feedRecord.id;
  return {
    id,
    label: commandLabel,
    category: category,
    originalValue: feedRecord.name,
    run: run,
    icon: <FeedAvatar image={feedRecord.icon} />,
    timestamp: new Date(feedRecord.createdAt).getTime(),
  };
};

function useSearchedFeedCommands(onSelect: (record: FeedRecord) => void) {
  const subscribeFeed = useService(FeedsService).searchModal;
  const query = useLiveData(subscribeFeed.query$);
  const [cmds, setCmds] = useState<FeedSearchCommand[]>([]);

  useEffect(() => {
    const searchFeeds = async () => {
      const subscriptions = await subscribeFeed.searchFeeds(query);
      const cmds = subscriptions.map(subscription => {
        const category = 'affine:pages';
        return feedRecordToCommand(category, subscription, () =>
          onSelect(subscription)
        );
      });

      setCmds(cmds);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    searchFeeds().then();
  }, [subscribeFeed, onSelect, query]);

  return cmds;
}

export const useSearchedFeedsCommands = () => {
  const workspace = useService(WorkspaceService).workspace;
  const navigationHelper = useNavigateHelper();
  const subscribe = useSubscribeToFeed();
  const t = useI18n();

  const onSelectPage = useCallback(
    (record: FeedRecord) => {
      if (!workspace) {
        console.error('current workspace not found');
        return;
      }

      subscribe(record);
      toast(t['ai.wemem.notification.message.feed-added']());
      navigationHelper.jumpToFeedsDocs(workspace.id, 'all', record.id);
    },
    [subscribe, navigationHelper, t, workspace]
  );

  return useSearchedFeedCommands(onSelectPage);
};

export const useCommandGroups = () => {
  const searchedFeedsCommands = useSearchedFeedsCommands();
  const defaultCommands = useMemo(() => {
    return FeedSearchCommandRegistry.getAll();
  }, []);
  const searchModal = useService(FeedsService).searchModal;
  const query = useLiveData(searchModal.query$).trim();

  return useMemo(() => {
    const commands = [...searchedFeedsCommands, ...defaultCommands];
    return filterSortAndGroupCommands(commands, query);
  }, [defaultCommands, searchedFeedsCommands, query]);
};

export const useSubscribeToFeed = () => {
  const feedsService = useService(FeedsService);
  const currentFolder = useLiveData(feedsService.searchModal.currentFolder$);
  return useCallback(
    (feedRecord: FeedRecord) => {
      let folder = feedsService.feedTree.rootFolder;
      if (currentFolder?.folderId) {
        const currFolderNode = feedsService.feedTree.folderNodeById(
          currentFolder?.folderId
        );
        if (currFolderNode) {
          folder = currFolderNode;
        }
      }

      // if the feed is already added, do nothing
      if (feedsService.feedTree.feedNodeByUrl(feedRecord.url)) {
        return;
      }

      folder.createFeed(
        feedRecord.id,
        feedRecord.name,
        feedRecord.url,
        feedRecord.description,
        feedRecord.icon
      );
      return;
    },
    [currentFolder, feedsService]
  );
};
