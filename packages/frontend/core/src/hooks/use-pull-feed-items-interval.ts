import { GraphQLService } from '@affine/core/modules/cloud';
import { SubscriptionService } from '@affine/core/modules/feed/services/subscription-service';
import {
  FeedTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import { DebugLogger } from '@affine/debug';
import { searchQuery, type SearchSuccess } from '@affine/graphql';
import { importMarkDown } from '@blocksuite/blocks';
import type { JobMiddleware } from '@blocksuite/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useEffect, useRef } from 'react';

import { TagService } from '../modules/tag/service/tag';
import { useCurrentWorkspacePropertiesAdapter } from './use-affine-adapter';
import { usePagePropertiesMetaManager } from './use-page-properties-meta-manager';

const logger = new DebugLogger('usePullFeedItemsInterval');
export const usePullFeedItemsInterval = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const graphQLService = useService(GraphQLService);
  const feedService = useService(SubscriptionService);
  const tagList = useService(TagService).tagList;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunning = useRef(false);
  const adapter = useCurrentWorkspacePropertiesAdapter();
  const metaManager = usePagePropertiesMetaManager();
  useEffect(() => {
    metaManager.initInternalProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
        // const pullInput = feedService.subscriptions$.getValue().map(feed => ({
        //   feedId: feed.id,
        //   latestFeedItemId: feed.feed?.latestFeedItemId,
        // }));
        // logger.debug('pulling input', pullInput);
        // if (pullInput.length === 0) {
        //   return;
        // }

        const input = {
          // "after": "0",
          first: 10,
          query: 'in:sucess',
          includeContent: true,
        };

        const response = await graphQLService.exec({
          query: searchQuery,
          variables: input,
        });

        const searchSuccess = response.search as SearchSuccess;
        logger.debug(
          'pulling feed items response length',
          searchSuccess.edges.length ?? 0
        );

        for (const item of searchSuccess.edges || []) {
          const libraryItem = item.node;
          if (!currentWorkspace.docCollection.getDoc(libraryItem.id)) {
            const jobMiddleware: JobMiddleware = ({ slots }) => {
              slots.beforeImport.on(payload => {
                if (payload.type !== 'page') {
                  return;
                }
                payload.snapshot.meta.id = libraryItem.id;
                payload.snapshot.meta.createDate = new Date(
                  libraryItem.publishedAt || libraryItem.createdAt
                ).getTime();
              });
            };

            const docId = await importMarkDown(
              currentWorkspace.docCollection,
              libraryItem.readableContent,
              libraryItem.title,
              jobMiddleware
            );

            const tags = [FeedTag.id, UnseenTag.id];
            if (libraryItem.subscription) {
              tags.push(libraryItem.subscription);
            }

            currentWorkspace.docCollection.setDocMeta(docId, {
              tags,
              createDate: new Date(libraryItem.createdAt).getTime(),
            });

            logger.debug('import feed item to doc', {
              subscription: libraryItem.subscription,
              url: libraryItem.url,
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

    timerRef.current = setInterval(intervalCallback, 3000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
