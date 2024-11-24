'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MorningBrewHandler = void 0;
const content_handler_1 = require('../content-handler');
class MorningBrewHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.senderRegex = /Morning Brew <crew@morningbrew.com>/;
    this.urlRegex = /<a.* href=["']([^"']*)["'].*>View Online<\/a>/;
    this.name = 'morningbrew';
  }
  shouldPreParse(url, _dom) {
    const host = this.name + '.com';
    // check if url ends with morningbrew.com
    return new URL(url).hostname.endsWith(host);
  }
  async preParse(_url, dom) {
    // retain the width of the cells in the table of market info
    dom.querySelectorAll('.markets-arrow-cell').forEach(td => {
      const table = td.closest('table');
      if (table) {
        const bubbleTable = table.querySelector('.markets-bubble');
        if (bubbleTable) {
          // replace the nested table with the text
          const e = bubbleTable.querySelector('.markets-table-text');
          e && bubbleTable.parentNode?.replaceChild(e, bubbleTable);
        }
        // set custom class for the table
        table.className = 'morning-brew-markets';
      }
    });
    return Promise.resolve(dom);
  }
}
exports.MorningBrewHandler = MorningBrewHandler;
