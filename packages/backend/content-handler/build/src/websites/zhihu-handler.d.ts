import { ContentHandler } from '../content-handler';
export declare class ZhihuHandler extends ContentHandler {
  constructor();
  parseQuestion(element: Element): HTMLDivElement;
  parseComments(element: Element): HTMLDivElement;
  parseAuthors(element: Element): HTMLDivElement;
  shouldPreParse(url: string, _dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
}
