'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.TikTokHandler = void 0;
const content_handler_1 = require('../content-handler');
const axios_1 = __importDefault(require('axios'));
const underscore_1 = __importDefault(require('underscore'));
const getRedirectUrl = async url => {
  try {
    const response = await axios_1.default.get(url, {
      maxRedirects: 0,
      validateStatus: status => status === 302,
    });
    return response.headers.location;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.response && error.response.headers.location) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return error.response.headers.location;
    }
    return undefined;
  }
};
const escapeTitle = title => {
  return underscore_1.default.escape(title);
};
class TikTokHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'TikTok';
  }
  shouldPreHandle(url) {
    const u = new URL(url);
    return u.hostname.endsWith('tiktok.com');
  }
  async preHandle(url) {
    let fetchUrl = url;
    const u = new URL(url);
    if (
      u.hostname.startsWith('vm.tiktok.com') ||
      u.hostname.startsWith('vt.tiktok.com')
    ) {
      // Fetch the full URL
      const redirectedUrl = await getRedirectUrl(url);
      if (!redirectedUrl) {
        throw new Error('Could not fetch redirect URL for: ' + url);
      }
      fetchUrl = redirectedUrl;
    }
    const oembedUrl =
      `https://www.tiktok.com/oembed?format=json&url=` +
      encodeURIComponent(fetchUrl);
    const oembed = (await axios_1.default.get(oembedUrl.toString())).data;
    console.log('oembed results: ', oembed);
    // escape html entities in title
    const title = oembed.title;
    const escapedTitle = escapeTitle(title);
    const thumbnail = oembed.thumbnail_url;
    // const ratio = oembed.width / oembed.height
    // const height = 350
    // const _width = height * ratio
    const authorName = underscore_1.default.escape(oembed.author_name);
    // <p><a href="${url}" target="_blank">${escapedTitle}</a></p>
    const content = `
    <html>
      <head><title>TikTok page</title>
      <meta property="og:image" content="${thumbnail}" />
      <meta property="og:image:secure_url" content="${thumbnail}" />
      <meta property="og:title" content="${escapedTitle}" />
      <meta property="og:description" content="" />
      <meta property="og:article:author" content="${authorName}" />
      <meta property="og:site_name" content="TikTok" />
      <meta property="og:type" content="video" />
      </head>
      <body>
      <div>
        <article id="_omnivore_tiktok">
          <div id="_omnivore_tiktok_video">
          ${oembed.html}
          </div>
          <p itemscope="" itemprop="author" itemtype="http://schema.org/Person">By <a href="${oembed.author_url}" target="_blank">${authorName}</a></p>
        </article>
      </div>
      </body>
    </html>`;
    console.log('content, title', title, content);
    return { content, title };
  }
}
exports.TikTokHandler = TikTokHandler;
