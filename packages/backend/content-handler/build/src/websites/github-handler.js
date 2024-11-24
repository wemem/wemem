'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GitHubHandler = void 0;
const content_handler_1 = require('../content-handler');
class GitHubHandler extends content_handler_1.ContentHandler {
  constructor() {
    super();
    this.name = 'github';
  }
  shouldPreParse(url, _dom) {
    return url.includes('github.com');
  }
  async preParse(_url, dom) {
    const body = dom.querySelector('body');
    const article = dom.querySelector('article');
    const twitterTitle = dom.querySelector(`meta[name='twitter:title']`);
    const linkAuthor = dom.querySelector(`span[itemprop='author']`);
    if (body && article) {
      body.replaceChildren(article);
      // Attempt to set the author also. This is available on repo homepages
      // but not on things like PRs. Ideally we want PRs and issues to have
      // author set to the author of the PR/issue.
      if (linkAuthor && linkAuthor.textContent) {
        const author = dom.createElement('span');
        author.setAttribute('rel', 'author');
        author.innerHTML = linkAuthor.textContent;
        article.appendChild(author);
      }
    }
    // Remove the GitHub - and repo org from the title
    const twitterTitleContent = twitterTitle?.getAttribute('content');
    if (twitterTitle && twitterTitleContent) {
      twitterTitle.setAttribute(
        'content',
        twitterTitleContent.replace(/GitHub - (.*?)\//, '')
      );
    }
    return Promise.resolve(dom);
  }
}
exports.GitHubHandler = GitHubHandler;
