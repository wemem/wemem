import { ContentHandler, type PreHandleResult } from '../content-handler';
/**
 * Some of the content on Ars Technica is split over several pages.
 * If this is the case we should unfurl the entire article into one. l
 */
export declare class ArsTechnicaHandler extends ContentHandler {
  constructor();
  shouldPreHandle(url: string): boolean;
  hasMultiplePages(document: Document): boolean;
  grabContentFromUrl(url: string): Promise<Document>;
  extractArticleContentsFromLink(url: string): Promise<Document[]>;
  expandLinksAndCombine(document: Document): Promise<Document>;
  preHandle(url: string): Promise<PreHandleResult>;
}
