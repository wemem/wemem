import { randomUUID } from 'node:crypto';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import {
  FeedFetchContentType,
  FeedPageState,
  FeedType,
  PrismaClient,
  UserFeedStatus,
} from '@prisma/client';
import { Queue } from 'bullmq';

import { TracedLogger } from '../../fundamentals';
import { InvalidFeedUrl } from '../../fundamentals/error';
import { FEEDS_QUEUE, REFRESH_FEED_JOB } from './queue/const';
import { RefreshFeedJobData } from './service/refresh-feed';
import {
  Feed,
  PullFeedPagesOutput,
  SubscribeFeedInput,
  UserFeed,
} from './types';
import { parseFeed } from './utils/parser';
import { validateUrl } from './utils/validate';

@Injectable()
export class FeedsService {
  private readonly logger = new TracedLogger(FeedsService.name);

  constructor(
    private readonly prisma: PrismaClient,
    @InjectQueue(FEEDS_QUEUE) private readonly queue: Queue
  ) {}

  async pullFeedPages({
    after,
    first = 20,
    workspaceId,
    userId,
  }: {
    after?: string;
    first?: number;
    userId: string;
    workspaceId: string;
  }): Promise<PullFeedPagesOutput> {
    const limit = Math.min(first || 10, 100); // limit to 100 items
    const startCursor = after || '';

    const pages = await this.prisma.userFeedPage.findMany({
      where: {
        userId,
        workspaceId,
        state: {
          in: [FeedPageState.SUCCEEDED, FeedPageState.CONTENT_NOT_FETCHED],
        },
        feedUrl: {
          not: null,
        },
      },
      skip: Number(startCursor),
      take: limit + 1,
      include: {
        content: true,
      },
    });

    const start =
      startCursor && !isNaN(Number(startCursor)) ? Number(startCursor) : 0;
    const hasNextPage = pages.length > limit;
    const endCursor = String(start + pages.length - (hasNextPage ? 1 : 0));

    if (hasNextPage) {
      // remove an extra if exists
      pages.pop();
    }

    return {
      edges: pages.map(item => ({
        node: {
          ...item,
          aiSummary: item.content.aiSummary || '',
          content: item.content.id || '',
        },
        cursor: endCursor,
      })),
      pageInfo: {
        hasPreviousPage: false,
        startCursor,
        hasNextPage,
        endCursor,
      },
    };
  }

  /**
   * Search for feed sources by keyword
   *
   * Business flow:
   * 1. If keyword is empty, return empty array
   * 2. If keyword is a URL:
   *    - Validate URL format
   *    - Check if URL exists in database
   *    - If not exists, parse feed and create new source
   * 3. If keyword is text:
   *    - Search existing sources by name/description
   *
   * Use cases:
   * - User wants to subscribe to a new RSS feed by URL
   * - User wants to search existing feed sources by name
   * - User wants to validate if a URL is a valid RSS feed
   */
  async searchFeeds(keyword: string): Promise<Feed[]> {
    if (keyword.length === 0) {
      return [];
    }

    // If keyword is a URL, validate it
    if (keyword.startsWith('http:') || keyword.startsWith('https:')) {
      try {
        validateUrl(keyword);
      } catch (error) {
        throw new InvalidFeedUrl('Invalid feed URL.');
      }

      const exist = await this.prisma.feed.findFirst({
        where: {
          url: keyword,
        },
      });

      if (exist) {
        return [exist];
      }

      // TODO: Validate RSS feed
      const feed = await parseFeed(keyword);
      if (!feed) {
        throw new InvalidFeedUrl('Invalid feed URL.');
      }

      // Use transaction to prevent concurrent inserts
      return await this.prisma.$transaction(async tx => {
        // Check for existing subscription
        const exist = await tx.feed.findFirst({
          where: {
            OR: [{ url: feed.url }, { url: keyword }],
          },
        });

        if (exist) {
          return [exist];
        }

        // Insert new subscription
        const newFeed = await tx.feed.create({
          data: {
            name: feed.title,
            url: feed.url,
            description: feed.description,
            icon: feed.thumbnail,
          },
        });

        return [newFeed];
      });
    }

    // Search existing subscriptions
    const feeds = await this.prisma.feed.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { url: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    return feeds;
  }

  async subscribeFeed(
    input: SubscribeFeedInput,
    userId: string
  ): Promise<UserFeed> {
    const { feedId, workspaceId, isPrivate } = input;
    const feed = await this.prisma.feed.findUnique({
      where: { id: feedId },
    });

    if (!feed) {
      throw new Error('Feed not found');
    }

    // check if the subscription exists
    const subscripted = await this.prisma.userFeed.findFirst({
      where: {
        userId,
        workspaceId,
        url: feed.url,
      },
    });

    if (subscripted) {
      if (subscripted.status === UserFeedStatus.ACTIVE) {
        return subscripted;
      }

      // reactivate subscription
      const userSource = await this.prisma.userFeed.update({
        where: { id: subscripted.id },
        data: {
          status: UserFeedStatus.ACTIVE,
          isPrivate,
        },
      });

      // create a job to fetch feed content immediately
      const job = await this.queue.add(
        REFRESH_FEED_JOB,
        {
          refreshContext: {
            type: 'user-added',
            refreshID: randomUUID(),
            startedAt: new Date().toISOString(),
          },
          userFeedIds: [userSource.id],
          feedUrl: feed.url,
          mostRecentItemDates: [userSource.mostRecentItemDate?.getTime() || 0],
          lastFetchedChecksums: [userSource.lastFetchedChecksum || null],
          scheduledTimestamps: [Date.now()],
          fetchContentTypes: [userSource.fetchContentType],
          userIds: [userId],
          workspaceIds: [workspaceId],
        } as RefreshFeedJobData,
        {
          removeOnFail: true,
          removeOnComplete: true,
        }
      );

      this.logger.log(
        `Created refresh feed job ${job.id} for user ${userId} to re-fetch feed ${feed.url}`
      );

      return userSource;
    }

    // create a new subscription
    const MAX_SUBSCRIPTIONS = 100; // set max subscription count

    const subscriptionCount = await this.prisma.userFeed.count({
      where: {
        userId,
        workspaceId,
        status: UserFeedStatus.ACTIVE,
      },
    });

    if (subscriptionCount >= MAX_SUBSCRIPTIONS) {
      throw new Error('Exceeded maximum number of subscriptions');
    }

    const newUserFeed = await this.prisma.userFeed.create({
      data: {
        userId,
        name: feed.name,
        url: feed.url,
        description: feed.description,
        icon: feed.icon,
        isPrivate,
        workspaceId,
        status: UserFeedStatus.ACTIVE,
        type: FeedType.RSS,
        fetchContentType: FeedFetchContentType.ALWAYS,
      },
    });

    // create a job to fetch feed content
    const job = await this.queue.add(
      REFRESH_FEED_JOB,
      {
        refreshContext: {
          type: 'user-added',
          refreshID: randomUUID(),
          startedAt: new Date().toISOString(),
        },
        userFeedIds: [newUserFeed.id],
        feedUrl: feed.url,
        mostRecentItemDates: [0],
        lastFetchedChecksums: [null],
        scheduledTimestamps: [Date.now()],
        fetchContentTypes: [FeedFetchContentType.ALWAYS],
        userIds: [userId],
        workspaceIds: [workspaceId],
      } as RefreshFeedJobData,
      {
        removeOnFail: true,
        removeOnComplete: true,
      }
    );

    this.logger.log(
      `Created refresh feed job ${job.id} for user ${userId} to fetch feed ${feed.url}`
    );

    return newUserFeed;
  }

  async unsubscribeFeed(
    userFeedId: string,
    userId: string,
    workspaceId: string
  ): Promise<UserFeed> {
    // get the subscription
    const subscription = await this.prisma.userFeed.findFirst({
      where: {
        id: userFeedId,
        userId,
        workspaceId,
        status: UserFeedStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new Error('Active subscription not found');
    }

    // update the subscription status
    const updatedSource = await this.prisma.userFeed.update({
      where: { id: userFeedId },
      data: {
        status: UserFeedStatus.UNSUBSCRIBED,
      },
    });

    this.logger.log(
      `User ${userId} unsubscribed from feed ${subscription.url}`
    );

    return updatedSource;
  }
}
