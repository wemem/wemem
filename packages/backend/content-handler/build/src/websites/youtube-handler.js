'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.YoutubeHandler =
  exports.escapeTitle =
  exports.getYoutubePlaylistId =
  exports.getYoutubeVideoId =
    void 0;
const content_handler_1 = require('../content-handler');
const axios_1 = __importDefault(require('axios'));
const underscore_1 = __importDefault(require('underscore'));
const YOUTUBE_URL_MATCH =
  /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;
const getYoutubeVideoId = url => {
  const u = new URL(url);
  const videoId = u.searchParams.get('v');
  if (!videoId) {
    const match = url.toString().match(YOUTUBE_URL_MATCH);
    if (match === null || match.length < 6 || !match[5]) {
      return undefined;
    }
    return match[5];
  }
  return videoId;
};
exports.getYoutubeVideoId = getYoutubeVideoId;
const getYoutubePlaylistId = url => {
  const u = new URL(url);
  return u.searchParams.get('list');
};
exports.getYoutubePlaylistId = getYoutubePlaylistId;
const escapeTitle = title => {
  return underscore_1.default.escape(title);
};
exports.escapeTitle = escapeTitle;
class YoutubeHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Youtube';
  }
  shouldPreHandle(url) {
    return YOUTUBE_URL_MATCH.test(url.toString());
  }
  async preHandle(url) {
    const BaseUrl = 'https://www.youtube.com';
    const embedBaseUrl = 'https://www.youtube.com/embed';
    let urlToEncode;
    let src;
    const playlistId = (0, exports.getYoutubePlaylistId)(url);
    if (playlistId) {
      urlToEncode = `${BaseUrl}/playlist?list=${playlistId}`;
      src = `${embedBaseUrl}/videoseries?list=${playlistId}`;
    } else {
      const videoId = (0, exports.getYoutubeVideoId)(url);
      if (!videoId) {
        return {};
      }
      urlToEncode = `${BaseUrl}/watch?v=${videoId}`;
      src = `${embedBaseUrl}/${videoId}`;
    }
    const oembedUrl =
      `https://www.youtube.com/oembed?format=json&url=` +
      encodeURIComponent(urlToEncode);
    const oembed = (await axios_1.default.get(oembedUrl.toString())).data;
    // escape html entities in title
    const title = oembed.title;
    const escapedTitle = (0, exports.escapeTitle)(title);
    const ratio = oembed.width / oembed.height;
    const thumbnail = oembed.thumbnail_url;
    const height = 350;
    const width = height * ratio;
    const authorName = underscore_1.default.escape(oembed.author_name);
    const content = `
    <html>
      <head><title>${escapedTitle}</title>
      <meta property="og:image" content="${thumbnail}" />
      <meta property="og:image:secure_url" content="${thumbnail}" />
      <meta property="og:title" content="${escapedTitle}" />
      <meta property="og:description" content="${escapedTitle}" />
      <meta property="og:article:author" content="${authorName}" />
      <meta property="og:site_name" content="YouTube" />
      <meta property="og:type" content="video" />
      </head>
      <body>
      <div>
        <article id="_omnivore_youtube">
          <iframe id="_omnivore_youtube_video" width="${width}" height="${height}" src="${src}" title="${escapedTitle}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          <p><a href="${url}" target="_blank">${escapedTitle}</a></p>
          <p itemscope="" itemprop="author" itemtype="http://schema.org/Person">By <a href="${oembed.author_url}" target="_blank">${authorName}</a></p>
          <div id="_omnivore_youtube_transcript"></div>
        </article>
      </div>
      </body>
    </html>`;
    return { content, title };
  }
}
exports.YoutubeHandler = YoutubeHandler;
