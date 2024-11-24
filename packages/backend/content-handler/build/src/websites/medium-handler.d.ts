import { ContentHandler, type PreHandleResult } from '../content-handler';
export declare class MediumHandler extends ContentHandler {
  constructor();
  shouldPreHandle(url: string): boolean;
  preHandle(url: string): Promise<PreHandleResult>;
}
