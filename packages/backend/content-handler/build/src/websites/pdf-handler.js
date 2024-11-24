'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PdfHandler = void 0;
const content_handler_1 = require('../content-handler');
class PdfHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'PDF';
  }
  shouldPreHandle(url) {
    const u = new URL(url);
    const path = u.pathname.replace(u.search, '');
    return path.endsWith('.pdf');
  }
  async preHandle(_url) {
    return Promise.resolve({ contentType: 'application/pdf' });
  }
}
exports.PdfHandler = PdfHandler;
