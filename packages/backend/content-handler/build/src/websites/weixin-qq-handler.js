'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.WeixinQqHandler = void 0;
const luxon_1 = require('luxon');
const content_handler_1 = require('../content-handler');
class WeixinQqHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Weixin QQ';
  }
  shouldPreParse(url, _dom) {
    return new URL(url).hostname.endsWith('weixin.qq.com');
  }
  async preParse(_url, dom) {
    // Retrieve the publish time
    const publishTime = dom.querySelector('#publish_time')?.textContent;
    if (publishTime) {
      const dateTimeFormat = 'yyyy-LL-dd HH:mm';
      // published time is in UTC+8
      const publishTimeISO = luxon_1.DateTime.fromFormat(
        publishTime,
        dateTimeFormat,
        {
          zone: 'Asia/Shanghai',
        }
      ).toISO();
      // create a meta node to store the publish time in ISO format
      const metaNode = dom.createElement('meta');
      metaNode.setAttribute('name', 'date');
      metaNode.setAttribute('content', publishTimeISO || '');
      dom.querySelector('head')?.appendChild(metaNode);
    }
    // This replace the class name of the article info to preserve the block
    dom
      .querySelector('.rich_media_meta_list')
      ?.setAttribute('class', '_omnivore_rich_media_meta_list');
    // This removes the title
    dom.querySelector('.rich_media_title')?.remove();
    // This removes the profile info
    dom.querySelector('.profile_container')?.remove();
    //  This removes the footer
    dom.querySelector('#content_bottom_area')?.remove();
    dom.querySelector('.rich_media_area_extra')?.remove();
    dom.querySelector('#js_pc_qr_code')?.remove();
    return Promise.resolve(dom);
  }
}
exports.WeixinQqHandler = WeixinQqHandler;
