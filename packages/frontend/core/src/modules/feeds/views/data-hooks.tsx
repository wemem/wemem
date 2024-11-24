import { FeedAvatar, toast } from '@affine/component';
import { type CommandCategory } from '@affine/core/commands';
import { useNavigateHelper } from '@affine/core/components/hooks/use-navigate-helper';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import { DebugLogger } from '@affine/debug';
import { type SearchFeedSourcesQuery } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import {
  useLiveData,
  useService,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import { atom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { FeedSearchCommandRegistry } from '../commands';
import { filterSortAndGroupCommands } from './filter-commands';
import type { FeedSearchCommand } from './types';

export type FeedSourceRecord = NonNullable<
  SearchFeedSourcesQuery['searchFeedSources']
>[number];
export const cmdkValueAtom = atom('');

const feedRecordToCommand = (
  category: CommandCategory,
  feedRecord: FeedSourceRecord,
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

function useSearchedFeedCommands(onSelect: (record: FeedSourceRecord) => void) {
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

const logger = new DebugLogger('wemem:subscribe-feed');

export const useSearchedFeedsCommands = () => {
  const workspace = useService(WorkspaceService).workspace;
  const navigationHelper = useNavigateHelper();
  const subscribe = useSubscribeToFeed();
  const t = useI18n();

  const onSelectPage = useCallback(
    (record: FeedSourceRecord) => {
      if (!workspace) {
        console.error('current workspace not found');
        return;
      }

      subscribe(record)
        .then(feedId => {
          toast(t['ai.wemem.notification.message.feed-added']());
          navigationHelper.jumpToFeedsDocs(workspace.id, 'all', feedId);
        })
        .catch(err => {
          toast(t['ai.wemem.notification.message.feed-added-failed']());
          logger.error('Failed to subscribe feed', err);
        });
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
  const { feedsService } = useServices({
    FeedsService,
  });

  const currentFolder = useLiveData(feedsService.searchModal.currentFolder$);
  return useCallback(
    async (feedRecord: FeedSourceRecord): Promise<string> => {
      let folder = feedsService.feedTree.rootFolder;
      if (currentFolder?.folderId) {
        const currFolderNode = feedsService.feedTree.folderNodeById(
          currentFolder?.folderId
        );
        if (currFolderNode) {
          folder = currFolderNode;
        }
      }

      const rssNode = feedsService.feedTree.rssNodeBySource(feedRecord.url);
      // if the feed is already added, do nothing
      if (rssNode) {
        return rssNode.id as string;
      }

      const rssNodeId = folder.createRSS(
        feedRecord.id,
        feedRecord.name,
        feedRecord.url,
        feedRecord.description,
        feedRecord.icon
      );
      return rssNodeId;
    },
    [currentFolder, feedsService]
  );
};
