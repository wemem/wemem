'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.EnergyWorldHandler = void 0;
const content_handler_1 = require('../content-handler');
class EnergyWorldHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Energy World';
  }
  async isNewsletter(input) {
    return Promise.resolve(
      input.from === 'ETEnergyworld Latest News<newsletter@etenergyworld.com>'
    );
  }
  shouldPreParse(_url, dom) {
    return dom.querySelectorAll('img[src*="etenergyworld.png"]').length > 0;
  }
  async preParse(_url, dom) {
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
exports.EnergyWorldHandler = EnergyWorldHandler;
