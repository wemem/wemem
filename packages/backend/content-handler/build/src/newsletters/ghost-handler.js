'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GhostHandler = void 0;
const content_handler_1 = require('../content-handler');
class GhostHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'ghost';
  }
  findNewsletterHeaderHref(dom) {
    const readOnline = dom.querySelector('.view-online-link');
    return readOnline?.getAttribute('href') || undefined;
  }
  async isNewsletter(input) {
    const dom = input.dom;
    return Promise.resolve(
      dom.querySelectorAll('img[src*="ghost.org"]').length > 0
    );
  }
  async parseNewsletterUrl(_headers, html) {
    return this.findNewsletterUrl(html);
  }
}
exports.GhostHandler = GhostHandler;
