import { PagePropertiesManager } from '@affine/core/components/affine/page-properties';
import {
  AuthorProperty,
  OriginalProperty,
} from '@affine/core/components/affine/page-properties/internal-properties';
import { useCurrentWorkspacePropertiesAdapter } from '@affine/core/components/hooks/use-affine-adapter';
import { usePagePropertiesMetaManager } from '@affine/core/components/hooks/use-page-properties-meta-manager';
import { GraphQLService } from '@affine/core/modules/cloud';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import { TagService } from '@affine/core/modules/tag';
import { FeedTag } from '@affine/core/modules/tag/entities/internal-tag';
import { DebugLogger } from '@affine/debug';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { type PullFeedPagesQuery, pullFeedPagesQuery } from '@affine/graphql';
import { importMarkDown } from '@blocksuite/affine/blocks';
import type { JobMiddleware } from '@blocksuite/affine/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useEffect, useState } from 'react';

const initIntervalDuration = 1000 * 3; // Initial interval duration is 3 seconds
const maxIntervalDuration = 1000 * 60 * 30; // Maximum interval duration is 30 minutes
const logger = new DebugLogger('wemem:pull-articles');

let timer: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * A hook that manages periodic feed pulling with exponential backoff
 *
 * Flow:
 * 1. Initialize interval timer with 3s duration
 * 2. On each interval:
 *    - Check if previous pull is still running
 *    - If running, skip current pull
 *    - If not running:
 *      - Pull feed items
 *      - On success: Reset interval to 3s
 *      - On failure: Increase interval up to 30min max
 * 3. Clean up timer on unmount
 */
export const usePullFeedInterval = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const graphQLService = useService(GraphQLService);
  const feedsService = useService(FeedsService);
  const tagList = useService(TagService).tagList;
  const adapter = useCurrentWorkspacePropertiesAdapter();
  const metaManager = usePagePropertiesMetaManager();

  const isCloudWorkspace =
    currentWorkspace.meta.flavour === WorkspaceFlavour.AFFINE_CLOUD;

  const [intervalDuration, setIntervalDuration] =
    useState(initIntervalDuration);

  // Initialize internal properties
  useEffect(() => {
    metaManager.initInternalProperties();
  }, []);

  // Initialize internal tags
  useEffect(() => {
    tagList.initInternalTags();
  }, []);

  // Main pulling logic
  useEffect(() => {
    if (!isCloudWorkspace) {
      return;
    }

    // Clear old timer
    if (timer) {
      clearInterval(timer);
    }

    // Pull feed items
    const fetchFeedItems = async () => {
      logger.debug('Start pulling feed items');

      if (isRunning) {
        logger.debug('Previous pulling is still running, skip this time');
        return;
      }

      isRunning = true;

      try {
        // Execute query
        const response = await graphQLService.gql({
          query: pullFeedPagesQuery,
          variables: {
            after: feedsService.cursor,
            first: 10,
            workspaceId: currentWorkspace.id,
          },
        });

        const pullPages = response.pullFeedPages;
        logger.debug('Pulled feed items count', pullPages.edges.length);

        // Dynamically adjust polling interval based on query results:
        // - If no more data, double the interval (up to max duration)
        // - If more data exists, reset to initial interval
        if (!pullPages.pageInfo.hasNextPage) {
          setIntervalDuration(prevDuration =>
            Math.min(prevDuration * 2, maxIntervalDuration)
          );
        } else {
          setIntervalDuration(initIntervalDuration);
        }

        // Process each feed item
        for (const item of pullPages.edges || []) {
          const article = item.node;
          if (!article.feedUrl) {
            continue;
          }

          const rssNode = feedsService.feedTree.rssNodeBySource(
            article.feedUrl
          );
          if (!rssNode) {
            logger.debug('RSS node not subscribed', {
              source: article.feedUrl,
            });
            continue;
          }

          // Check if document already exists
          if (!currentWorkspace.docCollection.getDoc(article.id)) {
            await importArticle(article);
          } else {
            logger.info('Document already exists', { id: article.id });
          }

          rssNode.incrUnreadCount(1);

          feedsService.updateCursor(item.cursor);
        }

        logger.debug('Pulling completed');
      } catch (error) {
        logger.error('Failed to pull feed items', error);
      } finally {
        isRunning = false;
      }
    };

    // Import feed item to document
    const importArticle = async (
      article: PullFeedPagesQuery['pullFeedPages']['edges'][number]['node']
    ) => {
      const jobMiddleware: JobMiddleware = ({ slots }) => {
        slots.beforeImport.on(payload => {
          if (payload.type !== 'page') return;

          payload.snapshot.meta.id = article.id;
          payload.snapshot.meta.tags = [FeedTag.id];
          payload.snapshot.meta.feedSource = article.feedUrl ?? undefined;
          payload.snapshot.meta.createDate = new Date(
            article.publishedAt || article.createdAt || new Date().toISOString()
          ).getTime();
        });
      };

      logger.info('Start importing article', {
        title: article.title,
        url: article.originalUrl,
        subscription: article.feedUrl,
      });

      const importStartTime = Date.now();

      const docId = (await importMarkDown(
        currentWorkspace.docCollection,
        article.content,
        article.title,
        jobMiddleware
      )) as string;

      // Add custom properties
      const propertiesManager = new PagePropertiesManager(adapter, docId);

      if (article.author) {
        propertiesManager.addCustomProperty(AuthorProperty.id, article.author);
      }

      if (article.originalUrl) {
        propertiesManager.addCustomProperty(
          OriginalProperty.id,
          article.originalUrl
        );
      }

      logger.debug('Feed item import completed', {
        docId,
        title: article.title,
        url: article.originalUrl,
        source: article.feedUrl,
        importDuration: `${Date.now() - importStartTime}ms`,
      });
    };

    // Set up timer
    timer = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchFeedItems();
    }, intervalDuration);

    // Cleanup function
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [intervalDuration, isCloudWorkspace]);
};
