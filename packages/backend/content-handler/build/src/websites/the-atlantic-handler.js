'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.TheAtlanticHandler = void 0;
const axios_1 = __importDefault(require('axios'));
const linkedom_1 = require('linkedom');
const content_handler_1 = require('../content-handler');
class TheAtlanticHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'The Atlantic';
  }
  shouldPreHandle(url) {
    const u = new URL(url);
    return u.hostname.endsWith('theatlantic.com');
  }
  removeRelatedContentLinks(articleContent) {
    const content = Array.from(articleContent.children);
    return content.filter(
      paragraph => !paragraph.className.startsWith('ArticleRelated')
    );
  }
  unfurlContent(content) {
    const articleContentSection = content.querySelector(
      '[data-event-module="article body"]'
    );
    // Remove the audio player.
    content.querySelector('[data-event-module="audio player"]')?.remove();
    if (!articleContentSection) {
      return content;
    }
    const articleContent = this.removeRelatedContentLinks(
      articleContentSection
    );
    const divOverArticle = content.createElement('div');
    divOverArticle.setAttribute('id', 'prehandled');
    articleContent.forEach(it => divOverArticle.appendChild(it));
    content.insertBefore(divOverArticle, articleContentSection);
    articleContentSection.remove();
    return content;
  }
  async preHandle(url) {
    // We simply retrieve the article without Javascript enabled using a GET command.
    const response = await axios_1.default.get(url);
    const data = response.data;
    const dom = (0, linkedom_1.parseHTML)(data).document;
    const editedDom = this.unfurlContent(dom);
    return {
      content: editedDom.body.outerHTML,
      title: dom.title,
      dom: editedDom,
    };
  }
}
exports.TheAtlanticHandler = TheAtlanticHandler;
