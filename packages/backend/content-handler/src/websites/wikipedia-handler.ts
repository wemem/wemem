import { ContentHandler } from '../content-handler';

export class WikipediaHandler extends ContentHandler {
  constructor() {
    super();
    this.name = 'wikipedia';
  }

  override shouldPreParse(url: string, _dom: Document): boolean {
    return url.includes('wikipedia.org');
  }

  override async preParse(_url: string, dom: Document): Promise<Document> {
    // This removes the [edit] anchors from wikipedia pages
    dom.querySelectorAll('.mw-editsection').forEach(e => e.remove());

    // Remove footnotes
    dom.querySelectorAll('sup[class="reference"]').forEach(e => e.remove());

    // this removes the sidebar
    dom.querySelector('.infobox')?.remove();
    return Promise.resolve(dom);
  }
}
