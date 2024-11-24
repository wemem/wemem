interface Unsubscribe {
  mailTo?: string;
  httpUrl?: string;
}
export interface NewsletterInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  headers: Record<string, string | string[]>;
}
export interface NewsletterResult {
  email: string;
  content: string;
  url: string;
  title: string;
  author: string;
  unsubMailTo?: string;
  unsubHttpUrl?: string;
}
export interface PreHandleResult {
  url?: string;
  title?: string;
  content?: string;
  contentType?: string;
  dom?: Document;
}
export declare const FAKE_URL_PREFIX = 'https://omnivore.app/no_url?q=';
export declare const generateUniqueUrl: () => string;
export declare abstract class ContentHandler {
  protected senderRegex: RegExp;
  protected urlRegex: RegExp;
  name: string;
  protected constructor();
  shouldResolve(_url: string): boolean;
  resolve(url: string): Promise<string | undefined>;
  shouldPreHandle(_url: string): boolean;
  preHandle(url: string): Promise<PreHandleResult>;
  shouldPreParse(_url: string, _dom: Document): boolean;
  preParse(_url: string, dom: Document): Promise<Document>;
  isNewsletter(input: {
    from: string;
    html: string;
    headers: Record<string, string | string[]>;
    dom: Document;
  }): Promise<boolean>;
  findNewsletterHeaderHref(_dom: Document): string | undefined;
  findNewsletterUrl(html: string): Promise<string | undefined>;
  parseNewsletterUrl(
    _headers: Record<string, string | string[]>,
    html: string
  ): Promise<string | undefined>;
  parseAuthor(from: string): string;
  parseUnsubscribe(unSubHeader: string): Unsubscribe;
  handleNewsletter({
    from,
    to,
    subject,
    html,
    headers,
  }: NewsletterInput): Promise<NewsletterResult>;
}
export {};
