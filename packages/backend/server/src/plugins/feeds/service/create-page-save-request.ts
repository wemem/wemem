import * as crypto from 'node:crypto';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import {
  FeedArticleState,
  PrismaClient,
  User,
  UserFeedArticle,
} from '@prisma/client';
import { Queue } from 'bullmq';

import { Cache } from '../../../fundamentals';
import { FEEDS_QUEUE } from '../queue';
import { cleanUrl, generateSlug } from '../utils/helpers';
import { logger } from '../utils/logger';
import { validateUrl } from '../utils/validate';
import { isYouTubeVideoURL } from '../utils/youtube';
import { CreateLabelInput } from './save-page';
import { OriginalContentStorage } from '../../storage/wrappers/original-content';

interface PageSaveRequest {
  user: User;
  url: string;
  articleSavingRequestId?: string;
  state?: FeedArticleState;
  labels?: CreateLabelInput[];
  priority?: 'low' | 'high';
  locale?: string;
  timezone?: string;
  savedAt?: Date;
  publishedAt?: Date;
  folder?: string;
  subscription?: string;
}

const SAVING_CONTENT = 'Your link is being saved...';

@Injectable()
export class PageSaveRequestService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: Cache,
    private readonly originalContentStorage: OriginalContentStorage,
    @InjectQueue(FEEDS_QUEUE) private readonly queue: Queue
  ) {}

  // 5 items saved in the last minute: use low queue
  // default: use normal queue
  private async getPriorityByRateLimit(
    userId: string
  ): Promise<'low' | 'high'> {
    const count = await countBySavedAt(
      userId,
      new Date(Date.now() - 60 * 1000)
    );
    return count >= 5 ? 'low' : 'high';
  }

  async createPageSaveRequest({
    user,
    url,
    articleSavingRequestId,
    state,
    priority,
    labels,
    locale,
    timezone,
    savedAt,
    publishedAt,
    folder,
    subscription,
  }: PageSaveRequest): Promise<UserFeedArticle> {
    try {
      validateUrl(url);
    } catch (error) {
      logger.error('invalid url', { url, error });
      throw new Error('invalid url');
    }

    const userId = user.id;
    url = cleanUrl(url);

    // create processing item
    const article = await this.createOrUpdateLibraryItem(
      {
        id: articleSavingRequestId || undefined,
        userId,
        readableContent: SAVING_CONTENT,
        itemType: PageType.Unknown,
        slug: generateSlug(url),
        title: url,
        originalUrl: url,
        state: LibraryItemState.Processing,
        publishedAt,
        folder,
        subscription,
        savedAt,
      },
      userId,
      workspaceId
    );

    // get priority by checking rate limit if not specified
    priority = priority || (await this.getPriorityByRateLimit(userId));

    // enqueue task to parse item
    await enqueueParseRequest({
      url,
      userId,
      saveRequestId: libraryItem.id,
      priority,
      state,
      labels,
      locale,
      timezone,
      savedAt,
      publishedAt,
      folder,
      rssFeedUrl: subscription,
    });

    return libraryItem;
  }

  async createOrUpdateLibraryItem(
    article: Partial<UserFeedArticle>,
    userId: string,
    workspaceId: string,
    skipPubSub = false,
    originalContent: string | null = null
  ): Promise<UserFeedArticle> {
    const newArticle = await this.prisma.$transaction(async tx => {
      // 查找现有的文章
      const existingArticle = await tx.userFeedArticle.findFirst({
        where: {
          userId,
          workspaceId,
          originalUrl: article.originalUrl,
        },
      });

      if (existingArticle) {
        const id = existingArticle.id;
        const newItem = await tx.userFeedArticle.update({
          where: { id },
          data: {
            ...article,
          },
        });

        // 如果 ID 不同,删除新文章
        if (article.id && article.id !== id) {
          await tx.userFeedArticle.delete({
            where: { id: article.id },
          });
        }

        return newItem;
      }

      // 创建新文章
      return tx.userFeedArticle.create({
        data: article as UserFeedArticle,
      });
    });

    // 如果启用了 Redis,设置最近保存的文章
    await this.setRecentlySavedItemInRedis(userId, newArticle.originalUrl);

    if (skipPubSub || article.state === FeedArticleState.PROCESSING) {
      return newArticle;
    }

    await this.queue.add(FEEDS_QUEUE, newArticle);

    if (article.originalUrl && isYouTubeVideoURL(article.originalUrl)) {
      // await this.queue.add(PROCESS_YOUTUBE_VIDEO_JOB_NAME, {
      //   userId,
      //   articleId: newArticle.id,
      // })
    }

    if (originalContent) {
      const checksum = crypto
        .createHash('sha256')
        .update(originalContent)
        .digest('hex');

      const existingContent = await this.prisma.feedContent.findFirst({
        where: {
          checksum,
        },
      });
      if (!existingContent) {
        await this.originalContentStorage.put(
          checksum,
          Buffer.from(originalContent)
        );
      }
    }

    return newArticle;
  }

  async setRecentlySavedItemInRedis(userId: string, url: string) {
    // save the url in redis for 26 hours so rss-feeder won't try to re-save it
    const redisKey = `recent-saved-item:${userId}:${url}`;
    const ttlInSeconds = 60 * 60 * 26 * 1000;
    try {
      await this.cache.setnx(redisKey, 1, {
        ttl: ttlInSeconds,
      });
    } catch (error) {
      logger.error('error setting recently saved item in redis', {
        redisKey,
        error,
      });
    }
  }
}

export type CreateOrUpdateLibraryItemArgs = UserFeedArticle & {
  originalUrl: string;
};
