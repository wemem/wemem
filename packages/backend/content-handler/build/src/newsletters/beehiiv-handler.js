'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.BeehiivHandler = void 0;
const content_handler_1 = require('../content-handler');
class BeehiivHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'beehiiv';
  }
  async isNewsletter(input) {
    return Promise.resolve(
      input.headers['x-beehiiv-type']?.toString() === 'newsletter'
    );
  }
  async parseNewsletterUrl(headers, _html) {
    return Promise.resolve(headers['x-newsletter']?.toString());
  }
}
exports.BeehiivHandler = BeehiivHandler;
