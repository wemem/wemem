'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GolangHandler = void 0;
const content_handler_1 = require('../content-handler');
class GolangHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.senderRegex = /<.+@golangweekly.com>/;
    this.urlRegex = /<a href=["']([^"']*)["'].*>Read on the Web<\/a>/;
    this.name = 'golangweekly';
  }
  shouldPreParse(url, _dom) {
    const host = this.name + '.com';
    // check if url ends with golangweekly.com
    return new URL(url).hostname.endsWith(host);
  }
  async preParse(_url, dom) {
    const body = dom.querySelector('body');
    // this removes the "Subscribe" button
    body?.querySelector('.el-splitbar')?.remove();
    // this removes the title
    body?.querySelector('.el-masthead')?.remove();
    return Promise.resolve(dom);
  }
}
exports.GolangHandler = GolangHandler;
