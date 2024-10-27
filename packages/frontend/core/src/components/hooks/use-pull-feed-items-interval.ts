import { GraphQLService } from '@affine/core/modules/cloud';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import { TagService } from '@affine/core/modules/tag';
import { FeedTag } from '@affine/core/modules/tag/entities/internal-tag';
import { DebugLogger } from '@affine/debug';
import { searchQuery, type SearchSuccess } from '@affine/graphql';
import { importMarkDown } from '@blocksuite/affine/blocks';
import type { JobMiddleware } from '@blocksuite/affine/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useEffect, useRef, useState } from 'react';

import { PagePropertiesManager } from '../affine/page-properties';
import {
  AuthorProperty,
  OriginalProperty,
} from '../affine/page-properties/internal-properties';
import { useCurrentWorkspacePropertiesAdapter } from './use-affine-adapter';
import { usePagePropertiesMetaManager } from './use-page-properties-meta-manager';

const initIntervalDuration = 1000 * 3; // 初始间隔时间为3秒
const maxIntervalDuration = 1000 * 60 * 60; // 最大间隔时间为60分钟

const logger = new DebugLogger('usePullFeedItemsInterval');
export const usePullFeedItemsInterval = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const graphQLService = useService(GraphQLService);
  const feedsService = useService(FeedsService);
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
        // if (feedsService.feeds$.getValue().length === 0) {
        //   return;
        // }

        const input = {
          after: feedsService.afterCursor$.getValue(),
          // after: null,
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
                payload.snapshot.meta.tags = [FeedTag.id];
                payload.snapshot.meta.feedUrl =
                  libraryItem.subscription ?? undefined;
                payload.snapshot.meta.createDate = new Date(
                  libraryItem.publishedAt || libraryItem.createdAt
                ).getTime();
              });
            };

            logger.info('start import feed item', {
              title: libraryItem.title,
              url: libraryItem.url,
              subscription: libraryItem.subscription,
            });

            const importStartTime = Date.now();
            const docId = (await importMarkDown(
              currentWorkspace.docCollection,
              libraryItem.readableContent,
              libraryItem.title,
              jobMiddleware
            )) as string;

            // currentWorkspace.docCollection.setDocMeta(docId, {
            //   tags: [FeedTag.id],
            //   feedUrl: libraryItem.subscription ?? undefined,
            //   createDate: new Date(
            //     libraryItem.publishedAt || libraryItem.createdAt
            //   ).getTime(),
            // });

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

            const importDuration = Date.now() - importStartTime;

            logger.debug('end import feed item', {
              docId,
              title: libraryItem.title,
              url: libraryItem.url,
              subscription: libraryItem.subscription,
              importDuration: `${importDuration}ms`,
            });
            // const feed = feedsService.feedTree.feedNodeByUrl(
            //   libraryItem.subscription as string
            // );
            // if (!feed) {
            //   logger.info('feed not found', {
            //     subscription: libraryItem.subscription,
            //   });
            //   continue;
            // }

            // logger.debug(
            //   'create feed doc',
            //   feed.createFeedDoc(
            //     docId,
            //     libraryItem.title,
            //     libraryItem.url,
            //     libraryItem.description,
            //     libraryItem.author,
            //     libraryItem.image,
            //     new Date(libraryItem.createdAt).getTime()
            //   )
            // );

            // logger.debug('import feed item to doc', {
            //   subscription: libraryItem.subscription,
            //   url: libraryItem.url,
            //   docId,
            // });
          } else {
            // const feed = feedsService.feedTree.feedNodeByUrl(libraryItem.subscription as string);
            // logger.info('feed doc', feed?.createFeedDoc(libraryItem.id, libraryItem.title, libraryItem.url, libraryItem.description, libraryItem.author, libraryItem.image, new Date(libraryItem.createdAt).getTime()));
            logger.info('doc already exists', {
              id: libraryItem.id,
            });
          }
          feedsService.updateAfterCursor(item.cursor);
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
