import { ContentHandler } from '../content-handler';
export declare class EveryIoHandler extends ContentHandler {
  constructor();
  isNewsletter(input: {
    from: string;
    html: string;
    headers: Record<string, string | string[]>;
    dom: Document;
  }): Promise<boolean>;
  findNewsletterHeaderHref(dom: Document): string | undefined;
}
