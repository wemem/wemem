'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.EveryIoHandler = void 0;
const content_handler_1 = require('../content-handler');
class EveryIoHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Every.io';
  }
  async isNewsletter(input) {
    return Promise.resolve(input.from === 'Every <hello@every.to>');
  }
  findNewsletterHeaderHref(dom) {
    const readOnline = dom.querySelector('.newsletter-email .title a');
    return readOnline?.getAttribute('href') || undefined;
  }
}
exports.EveryIoHandler = EveryIoHandler;
