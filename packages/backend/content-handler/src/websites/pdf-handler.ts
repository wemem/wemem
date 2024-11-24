import { ContentHandler, type PreHandleResult } from '../content-handler';

export class PdfHandler extends ContentHandler {
  constructor() {
    super();
    this.name = 'PDF';
  }

  override shouldPreHandle(url: string): boolean {
    const u = new URL(url);
    const path = u.pathname.replace(u.search, '');
    return path.endsWith('.pdf');
  }

  override async preHandle(_url: string): Promise<PreHandleResult> {
    return Promise.resolve({ contentType: 'application/pdf' });
  }
}
