import crypto from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { OriginalContentStorage } from '../../../core/storage';
import { logger } from '../utils/logger';

@Injectable()
export class FeedContentService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly originalContentStorage: OriginalContentStorage
  ) {}

  async saveContent(content?: string): Promise<undefined | string> {
    if (!content) {
      return;
    }
    const checksum = crypto.createHash('sha256').update(content).digest('hex');

    const existingContent = await this.prisma.feedContent.findFirst({
      where: {
        id: checksum,
      },
    });

    if (!existingContent) {
      await this.originalContentStorage.put(checksum, Buffer.from(content));
      logger.log('Saved original content to storage', { checksum });

      await this.prisma.feedContent.create({
        data: {
          id: checksum,
        },
      });
    }

    return checksum;
  }
}
