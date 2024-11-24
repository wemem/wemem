import { ContentHandler } from '../content-handler';

export class EveryIoHandler extends ContentHandler {
  constructor() {
    super();
    this.name = 'Every.io';
  }

  override async isNewsletter(input: {
    from: string;
    html: string;
    headers: Record<string, string | string[]>;
    dom: Document;
  }): Promise<boolean> {
    return Promise.resolve(input.from === 'Every <hello@every.to>');
  }

  override findNewsletterHeaderHref(dom: Document): string | undefined {
    const readOnline = dom.querySelector('.newsletter-email .title a');
    return readOnline?.getAttribute('href') || undefined;
  }
}
