import { type AffineCommand, type CommandCategory, PreconditionStrategy } from '@affine/core/commands';
import { useCreateFeed2 } from '@affine/core/components/page-list';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { type SearchCallbackResult } from '@affine/core/modules/cmdk';
import { NewFeedService } from '@affine/core/modules/feed/new-feed';
import { NewFeedCommandRegistry } from '@affine/core/modules/feed/new-feed/commands';
import type { SearchFeedsQuery } from '@affine/graphql';
import { GlobalContextService, useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { atom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { filterSortAndGroupCommands } from './filter-commands';
import type { CMDKCommand, CommandContext } from './types';
import { notify, toast } from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';

export type FeedRecord = NonNullable<SearchFeedsQuery['searchFeeds']>[number];
export const cmdkValueAtom = atom('');

function filterCommandByContext(
  command: AffineCommand,
  context: CommandContext,
) {
  if (command.preconditionStrategy === PreconditionStrategy.Always) {
    return true;
  }
  if (command.preconditionStrategy === PreconditionStrategy.InEdgeless) {
    return context.docMode === 'edgeless';
  }
  if (command.preconditionStrategy === PreconditionStrategy.InPaper) {
    return context.docMode === 'page';
  }
  if (command.preconditionStrategy === PreconditionStrategy.InPaperOrEdgeless) {
    return !!context.docMode;
  }
  if (command.preconditionStrategy === PreconditionStrategy.Never) {
    return false;
  }
  if (typeof command.preconditionStrategy === 'function') {
    return command.preconditionStrategy();
  }
  return true;
}

function getAllCommand(context: CommandContext) {
  const commands = NewFeedCommandRegistry.getAll();
  return commands.filter(command => {
    return filterCommandByContext(command, context);
  });
}

const feedToCommand = (
  category: CommandCategory,
  feed: FeedRecord,
  run: () => void,
): CMDKCommand => {
  const commandLabel = {
    title: feed.title,
    subTitle: feed.description,
  };

  const id = category + '.' + feed.id;
  return {
    id,
    label: commandLabel,
    category: category,
    originalValue: feed.title,
    run: run,
    icon: <FeedAvatar image={feed.image} />,
    timestamp: new Date(feed.updated).getTime(),
  };
};

function useSearchedFeedsCommands(
  onSelect: (feed: FeedRecord) => void,
) {
  const newFeed = useService(NewFeedService).newFeed;
  const query = useLiveData(newFeed.query$);
  const [cmds, setCmds] = useState<CMDKCommand[]>([]);

  useEffect(() => {
    const searchFeeds = async () => {
      const feeds = await newFeed.getSearchedFeeds(query);
      const cmds = feeds.map(feed => {
        const category = 'affine:pages';
        return feedToCommand(
          category,
          feed,
          () => onSelect(feed),
        );
      });

      setCmds(cmds);
    };
    // eslint-disable-next-line
    // @typescript-eslint/ban-ts-comment
    searchFeeds().then();
  }, [newFeed, onSelect, query]);

  return cmds;
}

export const useSearchFeedsCommands = () => {
  const workspace = useService(WorkspaceService).workspace;
  const navigationHelper = useNavigateHelper();
  const createFeed = useCreateFeed2(workspace.docCollection);
  const t = useAFFiNEI18N();

  const onSelectPage = useCallback(
    (feed: FeedRecord) => {
      if (!workspace) {
        console.error('current workspace not found');
        return;
      }

      createFeed(feed);
      toast(t['ai.readflow.notification.message.feed-added']());
      navigationHelper.jumpToFeed(workspace.id, feed.id);
    },
    [createFeed, navigationHelper, t, workspace],
  );

  return useSearchedFeedsCommands(onSelectPage);
};

// todo: refactor to reduce duplication with usePageCommands
export const useSearchCallbackCommands = () => {
  const newFeed = useService(NewFeedService).newFeed;
  const workspace = useService(WorkspaceService).workspace;
  const onSelectPage = useCallback(
    (searchResult: SearchCallbackResult) => {
      if (!workspace) {
        console.error('current workspace not found');
        return;
      }
      newFeed.setSearchCallbackResult(searchResult);
    },
    [newFeed, workspace],
  );

  return useSearchedFeedsCommands(onSelectPage);
};

export const useCMDKCommandGroups = () => {
  const searchFeedsCommands = useSearchFeedsCommands();
  const currentDocMode =
    useLiveData(useService(GlobalContextService).globalContext.docMode.$) ??
    undefined;
  const newFeedsDefaultCommands = useMemo(() => {
    return getAllCommand({
      docMode: currentDocMode,
    });
  }, [currentDocMode]);
  const quickSearch = useService(NewFeedService).newFeed;
  const query = useLiveData(quickSearch.query$).trim();

  return useMemo(() => {
    const commands = [
      ...searchFeedsCommands,
      ...newFeedsDefaultCommands,
    ];
    return filterSortAndGroupCommands(commands, query);
  }, [newFeedsDefaultCommands, searchFeedsCommands, query]);
};

export const useSearchCallbackCommandGroups = () => {
  const searchCallbackCommands = useSearchCallbackCommands();

  const quickSearch = useService(NewFeedService).newFeed;
  const query = useLiveData(quickSearch.query$).trim();

  return useMemo(() => {
    const commands = [...searchCallbackCommands];
    return filterSortAndGroupCommands(commands, query);
  }, [searchCallbackCommands, query]);
};
