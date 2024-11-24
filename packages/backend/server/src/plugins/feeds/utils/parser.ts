/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-base-to-string */

import { randomUUID } from 'node:crypto';

import addressparser from 'addressparser';
import axios from 'axios';
import { parseHTML } from 'linkedom';
import Parser from 'rss-parser';
import sax from 'sax';
import showdown from 'showdown';

import { TracedLogger } from '../../../fundamentals';
const { parser } = sax;

interface Feed {
  title: string;
  url: string;
  type: string;
  thumbnail?: string;
  description?: string;
}

const axiosInstance = axios.create({
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0',
    Accept: 'text/html',
  },
  responseType: 'text',
});

export const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/octet-stream',
  'text/plain',
];

const ARTICLE_PREFIX = 'omnivore:';

export const FAKE_URL_PREFIX = 'https://omnivore.app/no_url?q=';
export const RSS_PARSER_CONFIG = {
  timeout: 20000, // 20 seconds
  headers: {
    // some rss feeds require user agent
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    Accept:
      'application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml;q=0.4, text/html;q=0.2',
  },
};

type Metadata = {
  title?: string;
  author?: string;
  description: string;
  previewImage: string;
};

export const parsePageMetadata = (html: string): Metadata | undefined => {
  const logger = new TracedLogger(parsePageMetadata.name);
  try {
    const document = parseHTML(html).document;

    // get open graph metadata
    const description =
      document
        .querySelector("head meta[property='og:description']")
        ?.getAttribute('content') || '';

    const previewImage =
      document
        .querySelector("head meta[property='og:image']")
        ?.getAttribute('content') || '';

    const title =
      document
        .querySelector("head meta[property='og:title']")
        ?.getAttribute('content') || undefined;

    const author =
      document
        .querySelector("head meta[name='author']")
        ?.getAttribute('content') || undefined;

    // TODO: we should be able to apply the JSONLD metadata
    // here too

    return { title, author, description, previewImage };
  } catch (e) {
    logger.log('failed to parse page:', e);
    return undefined;
  }
};

export const parseUrlMetadata = async (
  url: string
): Promise<Metadata | undefined> => {
  const logger = new TracedLogger(parseUrlMetadata.name);
  try {
    const res = await axios.get(url);
    return parsePageMetadata(res.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(error.response);
    } else {
      logger.error(error);
    }
    return undefined;
  }
};

export const generateUniqueUrl = () => FAKE_URL_PREFIX + randomUUID();

export const getTitleFromEmailSubject = (subject: string) => {
  const title = subject.replace(ARTICLE_PREFIX, '');
  return title.trim();
};

export const parseEmailAddress = (from: string): addressparser.EmailAddress => {
  // get author name from email
  // e.g. 'Jackson Harper from Omnivore App <jacksonh@substack.com>'
  // or 'Mike Allen <mike@axios.com>'
  const parsed = addressparser(from);
  if (parsed.length > 0) {
    return parsed[0];
  }
  return { name: '', address: from };
};

export const fetchFavicon = async (
  url: string
): Promise<string | undefined> => {
  const logger = new TracedLogger(fetchFavicon.name);
  // don't fetch favicon for fake urls
  if (url.startsWith(FAKE_URL_PREFIX)) return undefined;
  try {
    // get the correct url if it's a redirect
    const response = await axios.head(url, { timeout: 5000 });
    const realUrl = response.request.res.responseUrl;
    const domain = new URL(realUrl).hostname;
    return `https://api.faviconkit.com/${domain}/128`;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      logger.log('failed to get favicon', e.response);
    } else {
      logger.log('failed to get favicon', e);
    }
    return undefined;
  }
};

export const markdownToHtml = (markdown: string) => {
  const converter = new showdown.Converter({
    backslashEscapesHTMLTags: true,
  });
  return converter.makeHtml(markdown);
};

const fetchHtml = async (url: string): Promise<string | null> => {
  const logger = new TracedLogger(fetchHtml.name);
  try {
    const response = await axiosInstance.get(url);
    return response.data as string;
  } catch (error) {
    logger.error('Error fetching html', error);
    return null;
  }
};

export const parseOpml = (opml: string): Feed[] | undefined => {
  const logger = new TracedLogger(parseOpml.name);
  const xmlParser = parser(true, { lowercase: true });
  const feeds: Feed[] = [];
  const existingFeeds = new Map<string, boolean>();

  xmlParser.onopentag = function (node) {
    if (node.name === 'outline') {
      // folders also are outlines, make sure an xmlUrl is available
      const feedUrl = node.attributes.xmlUrl.toString();
      if (feedUrl && !existingFeeds.has(feedUrl)) {
        feeds.push({
          title: node.attributes.title.toString() || '',
          url: feedUrl,
          type: node.attributes.type.toString() || 'rss',
        });
        existingFeeds.set(feedUrl, true);
      }
    }
  };

  xmlParser.onend = function () {
    return feeds;
  };

  try {
    xmlParser.write(opml).close();
    return feeds;
  } catch (error) {
    logger.error('Error parsing opml', error);
    return undefined;
  }
};

export const parseHtml = async (url: string): Promise<Feed[] | undefined> => {
  const logger = new TracedLogger(parseHtml.name);
  // fetch HTML and parse feeds
  const html = await fetchHtml(url);
  if (!html) return undefined;

  try {
    const dom = parseHTML(html).document;
    const links = dom.querySelectorAll('link[type="application/rss+xml"]');
    const feeds = Array.from(links)
      .map(link => ({
        url: link.getAttribute('href') || '',
        title: link.getAttribute('title') || '',
        type: 'rss',
      }))
      .filter(feed => feed.url);

    return feeds;
  } catch (error) {
    logger.error('Error parsing html', error);
    return undefined;
  }
};

export const parseFeed = async (
  url: string,
  content?: string | null
): Promise<Feed | null> => {
  const logger = new TracedLogger(parseFeed.name);
  try {
    // check if url is a telegram channel
    const telegramRegex = /https:\/\/t\.me\/([a-zA-Z0-9_]+)/;
    const telegramMatch = url.match(telegramRegex);
    if (telegramMatch) {
      if (!content) {
        // fetch HTML and parse feeds
        content = await fetchHtml(url);
      }

      if (!content) return null;

      const dom = parseHTML(content).document;
      const title = dom.querySelector('meta[property="og:title"]');
      const thumbnail = dom.querySelector('meta[property="og:image"]');
      const description = dom.querySelector('meta[property="og:description"]');

      return {
        title: title?.getAttribute('content') || url,
        url,
        type: 'telegram',
        thumbnail: thumbnail?.getAttribute('content') || '',
        description: description?.getAttribute('content') || '',
      };
    }

    const parser = new Parser(RSS_PARSER_CONFIG);

    const feed = content
      ? await parser.parseString(content)
      : await parser.parseURL(url);

    const feedUrl = feed.feedUrl || url;

    return {
      title: feed.title || feedUrl,
      url: feedUrl,
      thumbnail: feed.image?.url,
      type: 'rss',
      description: feed.description,
    };
  } catch (error) {
    logger.error('Error parsing feed', error);
    return null;
  }
};
