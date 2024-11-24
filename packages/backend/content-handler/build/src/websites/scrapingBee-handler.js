'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ScrapingBeeHandler = void 0;
const content_handler_1 = require('../content-handler');
const axios_1 = __importDefault(require('axios'));
const linkedom_1 = require('linkedom');
class ScrapingBeeHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'ScrapingBee';
  }
  shouldPreHandle(url) {
    const u = new URL(url);
    const hostnames = ['nytimes.com', 'news.google.com', 'fool.ca'];
    return hostnames.some(h => u.hostname.endsWith(h));
  }
  async preHandle(url) {
    console.log('prehandling url with scrapingbee', url);
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
      return { title: dom.title, content: response.data, url: url };
    } catch (error) {
      console.error('error prehandling url w/scrapingbee', error);
      throw error;
    }
  }
}
exports.ScrapingBeeHandler = ScrapingBeeHandler;
