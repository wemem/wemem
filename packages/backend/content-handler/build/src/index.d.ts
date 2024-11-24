import type {
  ContentHandler,
  NewsletterInput,
  NewsletterResult,
  PreHandleResult,
} from './content-handler';
export declare const preHandleContent: (
  url: string
) => Promise<PreHandleResult | undefined>;
export declare const preParseContent: (
  url: string,
  dom: Document
) => Promise<Document | undefined>;
export declare const getNewsletterHandler: (input: {
  from: string;
  html: string;
  headers: Record<string, string | string[]>;
}) => Promise<ContentHandler | undefined>;
export declare const handleNewsletter: (
  input: NewsletterInput
) => Promise<NewsletterResult | undefined>;
