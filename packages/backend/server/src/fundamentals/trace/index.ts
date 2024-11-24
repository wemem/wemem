import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { TraceMiddleware } from './trace';

@Global()
@Module({})
export class TraceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}

export * from './trace';
