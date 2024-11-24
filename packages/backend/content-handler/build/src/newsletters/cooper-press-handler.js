'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CooperPressHandler = void 0;
const content_handler_1 = require('../content-handler');
class CooperPressHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'cooper-press';
  }
  findNewsletterHeaderHref(dom) {
    const readOnline = dom.querySelectorAll('a');
    let res = undefined;
    readOnline.forEach(e => {
      if (e.textContent === 'Read on the Web') {
        res = e.getAttribute('href') || undefined;
      }
    });
    return res;
  }
  async isNewsletter(input) {
    const dom = input.dom;
    return Promise.resolve(
      dom.querySelectorAll('a[href*="cooperpress.com"]').length > 0
    );
  }
  async parseNewsletterUrl(_headers, html) {
    return this.findNewsletterUrl(html);
  }
}
exports.CooperPressHandler = CooperPressHandler;
