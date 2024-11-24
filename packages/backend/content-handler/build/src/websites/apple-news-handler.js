'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.AppleNewsHandler = void 0;
const axios_1 = __importDefault(require('axios'));
const linkedom_1 = require('linkedom');
const content_handler_1 = require('../content-handler');
class AppleNewsHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Apple News';
  }
  shouldPreHandle(url) {
    const u = new URL(url);
    return u.hostname === 'apple.news';
  }
  async preHandle(url) {
    const MOBILE_USER_AGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36';
    const response = await axios_1.default.get(url, {
      headers: { 'User-Agent': MOBILE_USER_AGENT },
    });
    const data = response.data;
    const dom = (0, linkedom_1.parseHTML)(data).document;
    // make sure it's a valid URL by wrapping in new URL
    const href = dom
      .querySelector('span.click-here')
      ?.parentElement?.getAttribute('href');
    const u = href ? new URL(href) : undefined;
    return { url: u?.href };
  }
}
exports.AppleNewsHandler = AppleNewsHandler;
