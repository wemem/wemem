import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Redis as IORedis, RedisOptions } from 'ioredis';

import { Config } from '../../fundamentals/config';

class Redis extends IORedis implements OnModuleDestroy, OnModuleInit {
  logger = new Logger(Redis.name);
  constructor(opts: RedisOptions) {
    super({
      ...opts,
      lazyConnect: true,
      family: 0, // 同时支持IPv4和IPv6
    });
  }

  async onModuleInit() {
    await this.connect().catch(() => {
      this.logger.error('Failed to connect to Redis server.');
    });
  }
  onModuleDestroy() {
    this.disconnect();
  }
}

@Injectable()
export class CacheRedis extends Redis {
  constructor(config: Config) {
    super(config.plugins.redis);
  }
}

@Injectable()
export class SessionRedis extends Redis {
  constructor(config: Config) {
    super({ ...config.plugins.redis, db: (config.plugins.redis.db ?? 0) + 2 });
  }
}

@Injectable()
export class SocketIoRedis extends Redis {
  constructor(config: Config) {
    super({ ...config.plugins.redis, db: (config.plugins.redis.db ?? 0) + 3 });
  }
}
