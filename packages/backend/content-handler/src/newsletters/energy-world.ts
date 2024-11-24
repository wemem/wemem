import { ContentHandler } from '../content-handler';

export class EnergyWorldHandler extends ContentHandler {
  constructor() {
    super();
    this.name = 'Energy World';
  }

  override async isNewsletter(input: {
    from: string;
    html: string;
    headers: Record<string, string | string[]>;
    dom: Document;
  }): Promise<boolean> {
    return Promise.resolve(
      input.from === 'ETEnergyworld Latest News<newsletter@etenergyworld.com>'
    );
  }

  override shouldPreParse(_url: string, dom: Document): boolean {
    return dom.querySelectorAll('img[src*="etenergyworld.png"]').length > 0;
  }

  override async preParse(_url: string, dom: Document): Promise<Document> {
    // get the main content
    const main = dom.querySelector('table[class="nletter-wrap"]');
    if (!main) {
      return Promise.resolve(dom);
    }

    // create a new dom
    const newDom = dom.createDocumentFragment();

    // add the content to the new dom
    main.querySelectorAll('table[class="multi-cols"] tr').forEach(tr => {
      const p = dom.createElement('p');
      p.innerHTML = tr.innerHTML;
      newDom.appendChild(p);
    });
    dom.body.replaceChildren(newDom);

    return Promise.resolve(dom);
  }
}
