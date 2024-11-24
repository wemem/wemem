'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.HeyWorldHandler = void 0;
const content_handler_1 = require('../content-handler');
class HeyWorldHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'hey-world';
    this.senderRegex = /<.+@world.hey.com>/;
  }
  findNewsletterHeaderHref(dom) {
    const readOnline = dom.querySelectorAll('a');
    let res = undefined;
    readOnline.forEach(e => {
      if (e.textContent === 'View this post online') {
        res = e.getAttribute('href') || undefined;
      }
    });
    return res;
  }
  async parseNewsletterUrl(_headers, html) {
    return this.findNewsletterUrl(html);
  }
}
exports.HeyWorldHandler = HeyWorldHandler;
