import { ContentHandler, type PreHandleResult } from '../content-handler';
export declare class TwitterHandler extends ContentHandler {
  constructor();
  shouldPreHandle(url: string): boolean;
  preHandle(url: string): Promise<PreHandleResult>;
}
