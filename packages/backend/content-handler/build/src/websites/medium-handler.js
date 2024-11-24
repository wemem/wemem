'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MediumHandler = void 0;
const content_handler_1 = require('../content-handler');
class MediumHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Medium';
  }
  shouldPreHandle(url) {
    const u = new URL(url);
    return u.hostname.endsWith('medium.com');
  }
  async preHandle(url) {
    console.log('prehandling medium url', url);
    try {
      const res = new URL(url);
      res.searchParams.delete('source');
      return Promise.resolve({ url: res.toString() });
    } catch (error) {
      console.error('error prehandling medium url', error);
      throw error;
    }
  }
}
exports.MediumHandler = MediumHandler;
