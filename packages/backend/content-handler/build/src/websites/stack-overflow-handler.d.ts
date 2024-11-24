import { ContentHandler } from '../content-handler';
export declare class StackOverflowHandler extends ContentHandler {
  constructor();
  parseText(element: Element, title: string): HTMLDivElement;
  parseComments(element: Element): HTMLDivElement;
  parseAuthors(element: Element): HTMLDivElement;
  shouldPreParse(_url: string, _dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
}
