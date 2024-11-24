'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.WikipediaHandler = void 0;
const content_handler_1 = require('../content-handler');
class WikipediaHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'wikipedia';
  }
  shouldPreParse(url, _dom) {
    return url.includes('wikipedia.org');
  }
  async preParse(_url, dom) {
    // This removes the [edit] anchors from wikipedia pages
    dom.querySelectorAll('.mw-editsection').forEach(e => e.remove());
    // Remove footnotes
    dom.querySelectorAll('sup[class="reference"]').forEach(e => e.remove());
    // this removes the sidebar
    dom.querySelector('.infobox')?.remove();
    return Promise.resolve(dom);
  }
}
exports.WikipediaHandler = WikipediaHandler;
