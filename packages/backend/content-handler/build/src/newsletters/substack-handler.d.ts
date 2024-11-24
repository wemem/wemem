import { ContentHandler } from '../content-handler';
export declare class SubstackHandler extends ContentHandler {
  constructor();
  shouldPreParse(url: string, dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
  findNewsletterHeaderHref(dom: Document): string | undefined;
  isNewsletter({
    headers,
    dom,
  }: {
    from: string;
    headers: Record<string, string | string[]>;
    dom: Document;
  }): Promise<boolean>;
  parseNewsletterUrl(
    headers: Record<string, string | string[]>,
    html: string
  ): Promise<string | undefined>;
  fixupStaticTweets(dom: Document): Document;
}
