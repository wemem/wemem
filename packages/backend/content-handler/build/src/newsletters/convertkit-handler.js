'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConvertkitHandler = void 0;
const content_handler_1 = require('../content-handler');
class ConvertkitHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'convertkit';
  }
  findNewsletterHeaderHref(dom) {
    const readOnline = dom.querySelectorAll('a');
    let res = undefined;
    readOnline.forEach(e => {
      if (
        e.textContent === 'View this email in your browser' ||
        e.textContent === 'Read on FS'
      ) {
        res = e.getAttribute('href') || undefined;
      }
    });
    return res;
  }
  async isNewsletter(input) {
    const dom = input.dom;
    const icons = dom.querySelectorAll(
      'img[src*="convertkit.com"], img[src*="convertkit-mail"]'
    );
    if (icons.length === 0) {
      return Promise.resolve(false);
    }
    // ignore newsletters that have a confirmation link to the newsletter in the body
    const links = dom.querySelectorAll(
      'a[href*="convertkit.com"], a[href*="convertkit-mail"]'
    );
    const isConfirmation = Array.from(links).some(e => {
      return e.textContent === 'Confirm your subscription';
    });
    return Promise.resolve(!isConfirmation);
  }
  async parseNewsletterUrl(_headers, html) {
    return this.findNewsletterUrl(html);
  }
}
exports.ConvertkitHandler = ConvertkitHandler;
