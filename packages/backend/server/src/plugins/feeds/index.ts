import { BullModule } from '@nestjs/bullmq';

import { StorageModule } from '../../core/storage';
import { Config, ConfigModule, ModuleConfig } from '../../fundamentals/config';
import { Plugin } from '../registry';
import { FEEDS_QUEUE, FeedsJobProcessor } from './queue';
import { FeedsResolver } from './resolver';
import { FeedsService } from './service';
import { FeedContentService } from './service/feed-content';
import { RefreshFeedService } from './service/refresh-feed';

@Plugin({
  name: 'feeds',
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [Config],
      useFactory: (config: Config) => ({
        connection: {
          host: config.plugins.redis?.host || 'localhost',
          port: config.plugins.redis?.port || 6379,
          username: config.plugins.redis?.username,
          password: config.plugins.redis?.password,
        },
      }),
    }),
    BullModule.registerQueue({
      name: FEEDS_QUEUE,
    }),
    StorageModule,
  ],
  providers: [
    FeedsResolver,
    FeedsService,
    RefreshFeedService,
    FeedContentService,
    FeedsJobProcessor,
  ],
  exports: [FeedsService],
  requires: ['plugins.feeds.contentFetchUrl'],
  if: config => !!config.plugins.redis,
})
export class FeedsModule {}

declare module '../config' {
  interface PluginsConfig {
    feeds: ModuleConfig<{
      enabled: boolean;
      contentFetchUrl: string;
      contentFetchToken: string;
    }>;
  }
}
