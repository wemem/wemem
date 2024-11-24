'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.BloombergHandler = void 0;
const axios_1 = __importDefault(require('axios'));
const linkedom_1 = require('linkedom');
const content_handler_1 = require('../content-handler');
class BloombergHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Bloomberg';
  }
  shouldPreHandle(url) {
    const BLOOMBERG_URL_MATCH =
      /https?:\/\/(www\.)?bloomberg.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;
    return BLOOMBERG_URL_MATCH.test(url.toString());
  }
  async preHandle(url) {
    console.log('prehandling bloomberg url', url);
    try {
      const response = await axios_1.default.get(
        'https://app.scrapingbee.com/api/v1',
        {
          params: {
            api_key: process.env.SCRAPINGBEE_API_KEY,
            url: url,
            return_page_source: true,
            block_ads: true,
            block_resources: false,
          },
        }
      );
      const dom = (0, linkedom_1.parseHTML)(response.data).document;
      return {
        title: dom.title,
        content: dom.querySelector('body')?.innerHTML,
        url: url,
      };
    } catch (error) {
      console.error('error prehandling bloomberg url', error);
      throw error;
    }
  }
}
exports.BloombergHandler = BloombergHandler;
