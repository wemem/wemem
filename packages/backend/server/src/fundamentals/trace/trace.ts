import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const traceContext = new AsyncLocalStorage<string>();

export class TracedLogger extends Logger {
  override log(message: string, ...optionalParams: any[]) {
    const traceId = traceContext.getStore() || 'NO_TRACE';
    super.log(`[${traceId}] ${message}`, ...optionalParams);
  }

  override error(
    message: any,
    ...optionalParams: [...any, string?, string?]
  ): void;
  override error(message: string, ...optionalParams: any[]) {
    const traceId = traceContext.getStore() || 'NO_TRACE';
    super.error(`[${traceId}] ${message}`, ...optionalParams);
  }

  override warn(message: string, ...optionalParams: any[]) {
    const traceId = traceContext.getStore() || 'NO_TRACE';
    super.warn(`[${traceId}] ${message}`, ...optionalParams);
  }

  override debug(message: string, ...optionalParams: any[]) {
    const traceId = traceContext.getStore() || 'NO_TRACE';
    super.debug(`[${traceId}] ${message}`, ...optionalParams);
  }

  override verbose(message: string, ...optionalParams: any[]) {
    const traceId = traceContext.getStore() || 'NO_TRACE';
    super.verbose(`[${traceId}] ${message}`, ...optionalParams);
  }
}

// Helper to run code with trace context
export const withTraceId = async <T>(
  traceId: string,
  fn: () => Promise<T>
): Promise<T> => {
  return traceContext.run(traceId, fn);
};

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Get trace ID from headers or generate new one
    const traceId = (req.headers['x-trace-id'] as string) || randomUUID();

    // Add trace ID to response headers
    res.setHeader('x-trace-id', traceId);

    // Run subsequent middleware and route handling with trace context
    await withTraceId(traceId, async () => {
      next();
    });
  }
}
