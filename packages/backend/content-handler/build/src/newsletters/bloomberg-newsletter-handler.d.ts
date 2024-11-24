import { ContentHandler } from '../content-handler';
export declare class BloombergNewsletterHandler extends ContentHandler {
  constructor();
  shouldPreParse(_url: string, dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
}
