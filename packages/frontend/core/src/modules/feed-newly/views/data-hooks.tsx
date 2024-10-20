import { toast } from '@affine/component';
import {
  type AffineCommand,
  type CommandCategory,
  PreconditionStrategy,
} from '@affine/core/commands';
import { useNavigateHelper } from '@affine/core/components/hooks/use-navigate-helper';
import { useSubscribeToFeed } from '@affine/core/components/page-list';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';
import { NewFeedService } from '@affine/core/modules/feed-newly';
import { NewFeedCommandRegistry } from '@affine/core/modules/feed-newly/commands';
import type { SearchSubscriptionsQuery } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import {
  GlobalContextService,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { atom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { filterSortAndGroupCommands } from './filter-commands';
import type { CMDKCommand, CommandContext } from './types';

export type FeedRecord = NonNullable<
  SearchSubscriptionsQuery['searchSubscriptions']
>[number];
export const cmdkValueAtom = atom('');

function filterCommandByContext(
  command: AffineCommand,
  context: CommandContext
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

const subscriptionToCommand = (
  category: CommandCategory,
  subscription: FeedRecord,
  run: () => void
): CMDKCommand => {
  const commandLabel = {
    title: subscription.name,
    subTitle: subscription.url || '',
  };

  const id = category + '.' + subscription.id;
  return {
    id,
    label: commandLabel,
    category: category,
    originalValue: subscription.name,
    run: run,
    icon: <FeedAvatar image={subscription.icon} />,
    timestamp: new Date(subscription.createdAt).getTime(),
  };
};

function useSearchedSubscribeFeedCommands(
  onSelect: (record: FeedRecord) => void
) {
  const subscribeFeed = useService(NewFeedService).subscribeFeed;
  const query = useLiveData(subscribeFeed.query$);
  const [cmds, setCmds] = useState<CMDKCommand[]>([]);

  useEffect(() => {
    const searchFeeds = async () => {
      const subscriptions = await subscribeFeed.searchFeeds(query);
      const cmds = subscriptions.map(subscription => {
        const category = 'affine:pages';
        return subscriptionToCommand(category, subscription, () =>
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

export const useSearchFeedsCommands = () => {
  const workspace = useService(WorkspaceService).workspace;
  const navigationHelper = useNavigateHelper();
  const subscribe = useSubscribeToFeed(workspace.docCollection);
  const t = useI18n();

  const onSelectPage = useCallback(
    (record: FeedRecord) => {
      if (!workspace) {
        console.error('current workspace not found');
        return;
      }

      subscribe(record);
      toast(t['ai.wemem.notification.message.feed-added']());
      navigationHelper.jumpToFeed(workspace.id, record.id);
    },
    [subscribe, navigationHelper, t, workspace]
  );

  return useSearchedSubscribeFeedCommands(onSelectPage);
};

// todo: refactor to reduce duplication with usePageCommands
export const useSearchCallbackCommands = () => {
  const subscribeFeed = useService(NewFeedService).subscribeFeed;
  const workspace = useService(WorkspaceService).workspace;
  const onSelectPage = useCallback(
    (feed: FeedRecord) => {
      if (!workspace) {
        console.error('current workspace not found');
        return;
      }
      subscribeFeed.setSearchCallbackResult(feed);
    },
    [subscribeFeed, workspace]
  );

  return useSearchedSubscribeFeedCommands(onSelectPage);
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
  const subscribeFeed = useService(NewFeedService).subscribeFeed;
  const query = useLiveData(subscribeFeed.query$).trim();

  return useMemo(() => {
    const commands = [...searchFeedsCommands, ...newFeedsDefaultCommands];
    return filterSortAndGroupCommands(commands, query);
  }, [newFeedsDefaultCommands, searchFeedsCommands, query]);
};

export const useSearchCallbackCommandGroups = () => {
  const searchCallbackCommands = useSearchCallbackCommands();

  const subscribeFeed = useService(NewFeedService).subscribeFeed;
  const query = useLiveData(subscribeFeed.query$).trim();

  return useMemo(() => {
    const commands = [...searchCallbackCommands];
    return filterSortAndGroupCommands(commands, query);
  }, [searchCallbackCommands, query]);
};
