import { ContentHandler, type PreHandleResult } from '../content-handler';
export declare class TheAtlanticHandler extends ContentHandler {
  constructor();
  shouldPreHandle(url: string): boolean;
  removeRelatedContentLinks(articleContent: Element): Node[];
  unfurlContent(content: Document): Document;
  preHandle(url: string): Promise<PreHandleResult>;
}
