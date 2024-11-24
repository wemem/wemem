'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.PipedVideoHandler = void 0;
const axios_1 = __importDefault(require('axios'));
const underscore_1 = __importDefault(require('underscore'));
const content_handler_1 = require('../content-handler');
class PipedVideoHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    // https://piped.video/watch?v={videoId}
    this.PIPED_URL_MATCH = /^((?:https?:)?\/\/)?piped\.video\/watch\?v=[^&]+/;
    this.getYoutubeVideoId = url => {
      const u = new URL(url);
      return u.searchParams.get('v');
    };
    this.escapeTitle = title => {
      return underscore_1.default.escape(title);
    };
    this.name = 'Piped-video';
  }
  shouldPreHandle(url) {
    return this.PIPED_URL_MATCH.test(url.toString());
  }
  async preHandle(url) {
    const videoId = this.getYoutubeVideoId(url);
    if (!videoId) {
      return {};
    }
    const baseUrl = 'https://api-piped.mha.fi';
    const apiUrl = `${baseUrl}/streams/${videoId}`;
    const metadata = (await axios_1.default.get(apiUrl)).data;
    const videoStreams = metadata.videoStreams;
    if (!videoStreams || videoStreams.length == 0) {
      return {};
    }
    const videoStream = videoStreams[0];
    const src = `https://piped.mha.fi/embed/${videoId}`;
    // escape html entities in title
    const title = metadata.title;
    const escapedTitle = this.escapeTitle(title);
    const ratio = videoStream.width / videoStream.height;
    const thumbnail = metadata.thumbnailUrl;
    const height = 350;
    const width = height * ratio;
    const authorName = underscore_1.default.escape(metadata.uploader);
    const content = `
    <html>
      <head>
        <title>${escapedTitle}</title>
        <meta property="og:image" content="${thumbnail}" />
        <meta property="og:image:secure_url" content="${thumbnail}" />
        <meta property="og:title" content="${escapedTitle}" />
        <meta property="og:description" content="${metadata.description}" />
        <meta property="og:article:author" content="${authorName}" />
        <meta property="og:site_name" content="Piped Video" />
        <meta property="article:published_time" content="${metadata.uploadDate}" />
        <meta property="og:type" content="video" />
      </head>
      <body>
      <iframe width="${width}" height="${height}" src="${src}" title="${escapedTitle}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        <p><a href="${url}" target="_blank">${escapedTitle}</a></p>
        <p itemscope="" itemprop="author" itemtype="http://schema.org/Person">By <a href="https://piped.video${metadata.uploaderUrl}" target="_blank">${authorName}</a></p>
      </body>
    </html>`;
    return { content, title };
  }
}
exports.PipedVideoHandler = PipedVideoHandler;
