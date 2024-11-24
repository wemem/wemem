import { ContentHandler } from '../content-handler';

export class GitHubHandler extends ContentHandler {
  constructor() {
    super();
    this.name = 'github';
  }

  override shouldPreParse(url: string, _dom: Document): boolean {
    return url.includes('github.com');
  }

  override async preParse(_url: string, dom: Document): Promise<Document> {
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
