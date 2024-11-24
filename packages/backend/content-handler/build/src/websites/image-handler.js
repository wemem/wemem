'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ImageHandler = void 0;
const content_handler_1 = require('../content-handler');
class ImageHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'Image';
  }
  shouldPreHandle(url) {
    const IMAGE_URL_PATTERN = /(https?:\/\/.*\.(?:jpg|jpeg|png|webp))/i;
    return IMAGE_URL_PATTERN.test(url.toString());
  }
  async preHandle(url) {
    const title = url.toString().split('/').pop() || 'Image';
    const content = `
      <html>
        <head>
          <title>${title}</title>
          <meta property="og:image" content="${url}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:type" content="image" />
        </head>
        <body>
          <div>
            <img src="${url}" alt="${title}">
          </div>
        </body>
      </html>`;
    return Promise.resolve({ title, content });
  }
}
exports.ImageHandler = ImageHandler;
