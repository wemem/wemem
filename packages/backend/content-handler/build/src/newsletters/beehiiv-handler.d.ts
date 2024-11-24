import { ContentHandler } from '../content-handler';
export declare class BeehiivHandler extends ContentHandler {
  constructor();
  isNewsletter(input: {
    from: string;
    headers: Record<string, string | string[]>;
  }): Promise<boolean>;
  parseNewsletterUrl(
    headers: Record<string, string | string[]>,
    _html: string
  ): Promise<string | undefined>;
}
