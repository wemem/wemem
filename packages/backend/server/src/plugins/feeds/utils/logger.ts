import { AsyncLocalStorage } from 'node:async_hooks';

import { Logger } from '@nestjs/common';

const traceContext = new AsyncLocalStorage<string>();

class TracedLogger extends Logger {
  override log(message: string, ...optionalParams: any[]) {
    const traceId = traceContext.getStore() || 'NO_TRACE';
    super.log(`[${traceId}] ${message}`, ...optionalParams);
  }

  override error(message: string, ...optionalParams: any[]) {
    const traceId = traceContext.getStore() || 'NO_TRACE';
    super.error(`[${traceId}] ${message}`, ...optionalParams);
  }
}

export const logger = new TracedLogger('Feeds');

// Helper to run code with trace context
export const withTraceId = async <T>(
  traceId: string,
  fn: () => Promise<T>
): Promise<T> => {
  return traceContext.run(traceId, fn);
};
