import { ContentHandler, type PreHandleResult } from '../content-handler';
export declare class PdfHandler extends ContentHandler {
  constructor();
  shouldPreHandle(url: string): boolean;
  preHandle(_url: string): Promise<PreHandleResult>;
}
