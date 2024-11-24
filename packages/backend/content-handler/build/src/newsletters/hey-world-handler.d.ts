import { ContentHandler } from '../content-handler';
export declare class HeyWorldHandler extends ContentHandler {
  constructor();
  findNewsletterHeaderHref(dom: Document): string | undefined;
  parseNewsletterUrl(
    _headers: Record<string, string | string[]>,
    html: string
  ): Promise<string | undefined>;
}
