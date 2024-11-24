import { ContentHandler, type PreHandleResult } from '../content-handler';
export declare class WiredHandler extends ContentHandler {
  constructor();
  isPaywalledContent(document: Document): boolean;
  removeNonArticleNodes(document: Document): Document;
  shouldPreHandle(url: string): boolean;
  preHandle(url: string): Promise<PreHandleResult>;
}
