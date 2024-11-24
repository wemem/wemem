'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ContentHandler =
  exports.generateUniqueUrl =
  exports.FAKE_URL_PREFIX =
    void 0;
const addressparser_1 = __importDefault(require('addressparser'));
const axios_1 = __importDefault(require('axios'));
const linkedom_1 = require('linkedom');
const node_crypto_1 = require('node:crypto');
exports.FAKE_URL_PREFIX = 'https://omnivore.app/no_url?q=';
const generateUniqueUrl = () =>
  exports.FAKE_URL_PREFIX + (0, node_crypto_1.randomUUID)();
exports.generateUniqueUrl = generateUniqueUrl;
class ContentHandler {
  constructor() {
    this.senderRegex = new RegExp(/NEWSLETTER_SENDER_REGEX/);
    this.urlRegex = new RegExp(/NEWSLETTER_URL_REGEX/);
    this.name = 'Handler name';
  }
  shouldResolve(_url) {
    return false;
  }
  async resolve(url) {
    return Promise.resolve(url);
  }
  shouldPreHandle(_url) {
    return false;
  }
  async preHandle(url) {
    return Promise.resolve({ url });
  }
  shouldPreParse(_url, _dom) {
    return false;
  }
  async preParse(_url, dom) {
    return Promise.resolve(dom);
  }
  async isNewsletter(input) {
    const re = new RegExp(this.senderRegex);
    const postHeader = input.headers['list-post'];
    const unSubHeader = input.headers['list-unsubscribe'];
    return Promise.resolve(
      re.test(input.from) && (!!postHeader || !!unSubHeader)
    );
  }
  findNewsletterHeaderHref(_dom) {
    return undefined;
  }
  // Given an HTML blob tries to find a URL to use for
  // a canonical URL.
  async findNewsletterUrl(html) {
    const dom = (0, linkedom_1.parseHTML)(html).document;
    // Check if this is a substack newsletter
    const href = this.findNewsletterHeaderHref(dom);
    if (href) {
      // Try to make a HEAD request, so we get the redirected URL, since these
      // will usually be behind tracking url redirects
      try {
        const response = await axios_1.default.head(href, { timeout: 5000 });
        return Promise.resolve(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          response.request.res.responseUrl
        );
      } catch (e) {
        console.log('error making HEAD request', e);
        return Promise.resolve(href);
      }
    }
    return Promise.resolve(undefined);
  }
  async parseNewsletterUrl(_headers, html) {
    // get url from dom
    const url = await this.findNewsletterUrl(html);
    if (url) {
      return url;
    }
    // get newsletter url from html
    const matches = html.match(this.urlRegex);
    if (matches) {
      return matches[1];
    }
    return undefined;
  }
  parseAuthor(from) {
    // get author name from email
    // e.g. 'Jackson Harper from Omnivore App <jacksonh@substack.com>'
    // or 'Mike Allen <mike@axios.com>'
    const parsed = (0, addressparser_1.default)(from);
    if (parsed.length > 0 && parsed[0].name) {
      return parsed[0].name;
    }
    return from;
  }
  parseUnsubscribe(unSubHeader) {
    // parse list-unsubscribe header
    // e.g. List-Unsubscribe: <https://omnivore.com/unsub>, <mailto:unsub@omnivore.com>
    return {
      httpUrl: unSubHeader.match(/<(https?:\/\/[^>]*)>/)?.[1],
      mailTo: unSubHeader.match(/<mailto:([^>]*)>/)?.[1],
    };
  }
  async handleNewsletter({ from, to, subject, html, headers }) {
    console.log('handleNewsletter', from, to, subject, headers);
    if (!from || !html || !subject || !to) {
      console.log('invalid newsletter email');
      throw new Error('invalid newsletter email');
    }
    // fallback to default url if newsletter url does not exist
    // assign a random uuid to the default url to avoid duplicate url
    const url =
      (await this.parseNewsletterUrl(headers, html)) ||
      (0, exports.generateUniqueUrl)();
    const author = this.parseAuthor(from);
    const unsubscribe = headers['list-unsubscribe']
      ? this.parseUnsubscribe(headers['list-unsubscribe'].toString())
      : undefined;
    return {
      email: to,
      content: html,
      url,
      title: subject,
      author,
      unsubMailTo: unsubscribe?.mailTo || '',
      unsubHttpUrl: unsubscribe?.httpUrl || '',
    };
  }
}
exports.ContentHandler = ContentHandler;
