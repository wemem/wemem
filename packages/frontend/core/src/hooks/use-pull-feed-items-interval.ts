import { GraphQLService } from '@affine/core/modules/cloud';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import { DebugLogger } from '@affine/debug';
import { pullFeedItemsQuery } from '@affine/graphql';
import { importMarkDown } from '@blocksuite/blocks';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useEffect } from 'react';

const logger = new DebugLogger('usePullFeedItemsInterval');
export const usePullFeedItemsInterval = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const graphQLService = useService(GraphQLService);
  const feedService = useService(FeedService);
  useEffect(() => {
    const timer = setInterval(() => {
      const pullInput = feedService.feeds$.getValue().map(feed => {
        return {
          feedId: feed.id,
        };
      });

      if (pullInput.length === 0) {
        return;
      }

      graphQLService.exec({
        query: pullFeedItemsQuery,
        variables: {
          pullInput,
        },
      }).then(response => {
        response.pullFeedItems?.forEach(item => {
          if (!currentWorkspace.docCollection.getDoc(item.feedItemId)) {
            importMarkDown(currentWorkspace.docCollection, item.contentMarkdown || item.descriptionMarkdown, item.title, item.feedItemId)
              .then((docId: string) => logger.debug('pull feed item', 'feedId:', item.feedId, 'itemItemId:', item.feedItemId, 'docId:', docId));
          }
        });
      }).catch(error => {
        logger.error('Pull feed items failed', error);
      });

    }, 5000);
    return () => {
      clearInterval(timer);
    };
  }, [currentWorkspace, graphQLService]);
};
