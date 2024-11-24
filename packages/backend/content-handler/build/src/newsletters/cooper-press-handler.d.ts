import { ContentHandler } from '../content-handler';
export declare class CooperPressHandler extends ContentHandler {
  constructor();
  findNewsletterHeaderHref(dom: Document): string | undefined;
  isNewsletter(input: {
    from: string;
    dom: Document;
    headers: Record<string, string | string[]>;
  }): Promise<boolean>;
  parseNewsletterUrl(
    _headers: Record<string, string | string[]>,
    html: string
  ): Promise<string | undefined>;
}
