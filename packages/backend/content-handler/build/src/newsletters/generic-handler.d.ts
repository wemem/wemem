import { ContentHandler } from '../content-handler';
export declare class GenericHandler extends ContentHandler {
  NEWSLETTER_URL_TEXT_REGEX: RegExp;
  constructor();
  isNewsletter(input: {
    from: string;
    html: string;
    headers: Record<string, string | string[]>;
    dom: Document;
  }): Promise<boolean>;
  findNewsletterHeaderHref(dom: Document): string | undefined;
  parseNewsletterUrl(
    headers: Record<string, string | string[]>,
    html: string
  ): Promise<string | undefined>;
}
