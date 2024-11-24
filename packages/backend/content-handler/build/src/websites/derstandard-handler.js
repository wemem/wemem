'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.DerstandardHandler = void 0;
const content_handler_1 = require('../content-handler');
const axios_1 = __importDefault(require('axios'));
const linkedom_1 = require('linkedom');
class DerstandardHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Derstandard';
  }
  shouldPreHandle(url) {
    const u = new URL(url);
    return u.hostname === 'www.derstandard.at';
  }
  async preHandle(url) {
    const response = await axios_1.default.get(url, {
      // set cookie to give consent to get the article
      headers: {
        cookie: `DSGVO_ZUSAGE_V1=true; consentUUID=2bacb9c1-1e80-4be0-9f7b-ee987cf4e7b0_6`,
      },
    });
    const content = response.data;
    const dom = (0, linkedom_1.parseHTML)(content).document;
    const titleElement = dom.querySelector('.article-title');
    titleElement && titleElement.remove();
    return {
      content: dom.body.outerHTML,
      title: titleElement?.textContent || undefined,
    };
  }
}
exports.DerstandardHandler = DerstandardHandler;
