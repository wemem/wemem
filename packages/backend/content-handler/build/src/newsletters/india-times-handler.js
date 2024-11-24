'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.IndiaTimesHandler = void 0;
const content_handler_1 = require('../content-handler');
const addressparser_1 = __importDefault(require('addressparser'));
class IndiaTimesHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'India Times';
  }
  async isNewsletter(input) {
    return Promise.resolve(
      (0, addressparser_1.default)(input.from).some(
        e => e.address === 'newsletters@timesofindia.com'
      )
    );
  }
  findNewsletterHeaderHref(dom) {
    const readOnline = dom.querySelectorAll('a');
    let res = undefined;
    readOnline.forEach(e => {
      if (e.textContent === 'view in browser') {
        res = e.getAttribute('href') || undefined;
      }
    });
    return res;
  }
}
exports.IndiaTimesHandler = IndiaTimesHandler;
