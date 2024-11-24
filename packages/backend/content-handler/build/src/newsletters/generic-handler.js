'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.GenericHandler = void 0;
const content_handler_1 = require('../content-handler');
const addressparser_1 = __importDefault(require('addressparser'));
class GenericHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    // newsletter url text regex for newsletters that don't have a newsletter header
    this.NEWSLETTER_URL_TEXT_REGEX =
      /((View|Read)(.*)(email|post)?(.*)(in your browser|online|on (FS|the Web))|Lire en ligne)/i;
    this.name = 'Generic Newsletter';
  }
  async isNewsletter(input) {
    const postHeader = input.headers['list-post'] || input.headers['list-id'];
    const unSubHeader = input.headers['list-unsubscribe'];
    return Promise.resolve(!!postHeader || !!unSubHeader);
  }
  findNewsletterHeaderHref(dom) {
    const readOnline = dom.querySelectorAll('a');
    let res = undefined;
    readOnline.forEach(e => {
      if (e.textContent && this.NEWSLETTER_URL_TEXT_REGEX.test(e.textContent)) {
        res = e.getAttribute('href') || undefined;
      }
    });
    return res;
  }
  async parseNewsletterUrl(headers, html) {
    // raw SubStack newsletter url is like <https://hongbo130.substack.com/p/tldr>
    // we need to get the real url from the raw url
    const postHeader = headers['list-post']?.toString();
    if (postHeader && (0, addressparser_1.default)(postHeader).length > 0) {
      return (0, addressparser_1.default)(postHeader)[0].name;
    }
    return this.findNewsletterUrl(html);
  }
}
exports.GenericHandler = GenericHandler;
