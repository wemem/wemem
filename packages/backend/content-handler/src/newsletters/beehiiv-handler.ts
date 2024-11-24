import { ContentHandler } from '../content-handler';

export class BeehiivHandler extends ContentHandler {
  constructor() {
    super();
    this.name = 'beehiiv';
  }

  override async isNewsletter(input: {
    from: string;
    headers: Record<string, string | string[]>;
  }): Promise<boolean> {
    return Promise.resolve(
      input.headers['x-beehiiv-type']?.toString() === 'newsletter'
    );
  }

  override async parseNewsletterUrl(
    headers: Record<string, string | string[]>,
    _html: string
  ): Promise<string | undefined> {
    return Promise.resolve(headers['x-newsletter']?.toString());
  }
}
