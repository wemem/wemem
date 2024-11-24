'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.RevueHandler = void 0;
const content_handler_1 = require('../content-handler');
class RevueHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'revue';
  }
  findNewsletterHeaderHref(dom) {
    const viewOnline = dom.querySelectorAll('table tr td a[target="_blank"]');
    let res = undefined;
    viewOnline.forEach(e => {
      if (e.textContent === 'View online') {
        res = e.getAttribute('href') || undefined;
      }
    });
    return res;
  }
  async isNewsletter(input) {
    const dom = input.dom;
    if (
      dom.querySelectorAll('img[src*="getrevue.co"], img[src*="revue.email"]')
        .length > 0
    ) {
      const getrevueUrl = this.findNewsletterHeaderHref(dom);
      if (getrevueUrl) {
        return Promise.resolve(true);
      }
    }
    return false;
  }
  async parseNewsletterUrl(_headers, html) {
    return this.findNewsletterUrl(html);
  }
}
exports.RevueHandler = RevueHandler;
