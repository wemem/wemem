import { GraphQLService } from '@affine/core/modules/cloud';
import { SubscriptionService } from '@affine/core/modules/feed/services/subscription-service';
import {
  SubscriptionTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import { DebugLogger } from '@affine/debug';
import { searchQuery, type SearchSuccess } from '@affine/graphql';
import { importMarkDown } from '@blocksuite/blocks';
import type { JobMiddleware } from '@blocksuite/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useEffect, useRef, useState } from 'react';

import { PagePropertiesManager } from '../components/affine/page-properties';
import {
  AuthorProperty,
  OriginalProperty,
} from '../components/affine/page-properties/internal-properties';
import { TagService } from '../modules/tag/service/tag';
import { useCurrentWorkspacePropertiesAdapter } from './use-affine-adapter';
import { usePagePropertiesMetaManager } from './use-page-properties-meta-manager';

const initIntervalDuration = 1000 * 3; // 初始间隔时间为3秒
const maxIntervalDuration = 1000 * 60 * 60; // 最大间隔时间为60分钟

const logger = new DebugLogger('usePullFeedItemsInterval');
export const usePullFeedItemsInterval = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const graphQLService = useService(GraphQLService);
  const subscriptionService = useService(SubscriptionService);
  const tagList = useService(TagService).tagList;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunning = useRef(false);
  const adapter = useCurrentWorkspacePropertiesAdapter();
  const metaManager = usePagePropertiesMetaManager();
  const [intervalDuration, setIntervalDuration] =
    useState(initIntervalDuration); // 初始间隔时间为3000毫秒
  useEffect(() => {
    metaManager.initInternalProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    tagList.initInternalTags();
  }, [tagList]);
  useEffect(() => {
    // 清除旧的定时器并设置新的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const fetchFeedItems = async () => {
      logger.debug('start pulling feed items');
      if (isRunning.current) {
        logger.debug('previous pulling is running, skip this time');
        return;
      }

      isRunning.current = true;
      try {
        if (subscriptionService.subscriptions$.getValue().length === 0) {
          return;
        }

        const input = {
          after: subscriptionService.afterCursor$.getValue(),
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
          'pulling subscription feed items response length',
          searchSuccess.edges.length
        );

        if (searchSuccess.edges.length === 0) {
          // 如果没有拉取到数据，间隔时间翻倍，最大不超过30分钟
          setIntervalDuration(prevDuration =>
            Math.min(prevDuration * 2, maxIntervalDuration)
          );
        } else {
          // 如果拉取到数据，重置间隔时间为初始值
          setIntervalDuration(initIntervalDuration);
        }

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

            const tags = [SubscriptionTag.id, UnseenTag.id];
            if (libraryItem.subscription) {
              tags.push(libraryItem.subscription);
            }
            currentWorkspace.docCollection.setDocMeta(docId, {
              tags,
              createDate: new Date(libraryItem.createdAt).getTime(),
            });

            const propertiesManager = new PagePropertiesManager(adapter, docId);

            libraryItem.author &&
              propertiesManager.addCustomProperty(
                AuthorProperty.id,
                libraryItem.author
              );
            libraryItem.url &&
              propertiesManager.addCustomProperty(
                OriginalProperty.id,
                libraryItem.url
              );

            logger.debug('import feed item to doc', {
              subscription: libraryItem.subscription,
              url: libraryItem.url,
              docId,
            });
          }
          subscriptionService.updateAfterCursor(item.cursor);
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

    timerRef.current = setInterval(intervalCallback, intervalDuration);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [intervalDuration]);
};
