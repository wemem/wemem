import { GraphQLService } from '@affine/core/modules/cloud';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import {
  FeedTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import { DebugLogger } from '@affine/debug';
import { pullFeedItemsQuery } from '@affine/graphql';
import { importMarkDown } from '@blocksuite/blocks';
import type { JobMiddleware } from '@blocksuite/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useEffect, useRef } from 'react';

import { TagService } from '../modules/tag/service/tag';

const logger = new DebugLogger('usePullFeedItemsInterval');
export const usePullFeedItemsInterval = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const graphQLService = useService(GraphQLService);
  const feedService = useService(FeedService);
  const tagList = useService(TagService).tagList;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunning = useRef(false);
  useEffect(() => {
    tagList.initInternalTags();
  }, [tagList]);
  useEffect(() => {
    const fetchFeedItems = async () => {
      logger.debug('start pulling feed items');
      if (isRunning.current) {
        logger.debug('previous pulling is running, skip this time');
        return;
      }

      isRunning.current = true;
      try {
        const pullInput = feedService.feeds$.getValue().map(feed => ({
          feedId: feed.id,
          latestFeedItemId: feed.feed?.latestFeedItemId,
        }));
        logger.debug('pulling input', pullInput);
        if (pullInput.length === 0) {
          return;
        }

        const response = await graphQLService.exec({
          query: pullFeedItemsQuery,
          variables: { pullInput },
        });

        logger.debug(
          'pulling feed items response length',
          response.pullFeedItems?.length ?? 0
        );

        for (const item of response.pullFeedItems || []) {
          if (!currentWorkspace.docCollection.getDoc(item.feedItemId)) {
            const jobMiddleware: JobMiddleware = ({ slots }) => {
              slots.beforeImport.on(payload => {
                if (payload.type !== 'page') {
                  return;
                }
                payload.snapshot.meta.id = item.feedItemId;
                payload.snapshot.meta.createDate = new Date(
                  item.publishedAt
                ).getTime();
              });
            };

            const docId = await importMarkDown(
              currentWorkspace.docCollection,
              item.contentMarkdown || item.descriptionMarkdown,
              item.title,
              jobMiddleware
            );
            currentWorkspace.docCollection.setDocMeta(docId, {
              tags: [FeedTag.id, item.feedId, UnseenTag.id],
              createDate: new Date(item.publishedAt).getTime(),
            });

            feedService.updateFeed(item.feedId, feed => ({
              ...feed,
              feed: {
                ...feed.feed,
                latestFeedItemId: item.feedItemId,
              },
            }));
            logger.debug('import feed item to doc', {
              feedItemId: item.feedItemId,
              feedId: item.feedId,
              docId,
            });
          }
        }
        logger.debug('finish pulling');
      } catch (error) {
        logger.error('pulling feed items failed', error);
      } finally {
        isRunning.current = false;
      }
    };

    const intervalCallback = () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchFeedItems();
    };

    timerRef.current = setInterval(intervalCallback, 5000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
