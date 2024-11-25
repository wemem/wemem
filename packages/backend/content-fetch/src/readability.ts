/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-base-to-string */

import { preParseContent } from '@wemem/content-handler';
import { Readability } from '@wemem/readability';
import createDOMPurify, { SanitizeElementHookEvent } from 'dompurify';
import * as hljs from 'highlightjs';
import { parseHTML } from 'linkedom';

export enum PageType {
  Article = 'ARTICLE',
  Book = 'BOOK',
  File = 'FILE',
  Highlights = 'HIGHLIGHTS',
  Image = 'IMAGE',
  Profile = 'PROFILE',
  Tweet = 'TWEET',
  Unknown = 'UNKNOWN',
  Video = 'VIDEO',
  Website = 'WEBSITE',
}

const logger = console;

export type PageInfo = {
  author?: string;
  canonicalUrl?: string;
  contentType?: string;
  description?: string;
  previewImage?: string;
  publishedAt?: string;
  title?: string;
};

export type PreparedDocument = {
  content: string;
  pageInfo: PageInfo;
};

export const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/octet-stream',
  'text/plain',
];

const DOM_PURIFY_CONFIG = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  FORBID_ATTR: [
    'data-ml-dynamic',
    'data-ml-dynamic-type',
    'data-orig-url',
    'data-ml-id',
    'data-ml',
    'data-xid',
    'data-feature',
  ],
};

/** Hook that prevents DOMPurify from removing youtube iframes */
const domPurifySanitizeHook = (
  node: Element,
  data: SanitizeElementHookEvent
): void => {
  if (data.tagName === 'iframe') {
    const urlRegex = /^(https?:)?\/\/www\.youtube(-nocookie)?\.com\/embed\//i;
    const src = node.getAttribute('src') || '';
    const dataSrc = node.getAttribute('data-src') || '';

    if (src && urlRegex.test(src)) {
      return;
    }

    if (dataSrc && urlRegex.test(dataSrc)) {
      node.setAttribute('src', dataSrc);
      return;
    }

    node.parentNode?.removeChild(node);
  }
};

export type ParsedContentPuppeteer = {
  parsedContent: Readability.ParseResult | null;
  canonicalUrl?: string | null;
  pageType: PageType;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type ArticleParseLogRecord = {
  url: string;
  userAgent?: string;
  pageInfo?: { [key: string]: any };
  blockedByClient?: boolean;
  parsedOrigin?: boolean;
  origin?: string;
  puppeteerSuccess?: boolean;
  puppeteerError?: { [key: string]: any };
  parseSuccess?: boolean;
  parseError?: { [key: string]: any };
  scrollError?: boolean;
  isAllowedContentType?: boolean;
  labels: { [key: string]: any };
};

const DEBUG_MODE = process.env.DEBUG === 'true' || false;

const parseOriginalContent = (document: Document): PageType => {
  try {
    const e = document.querySelector("head meta[property='og:type']");
    const content = e?.getAttribute('content');
    if (!content) {
      return PageType.Unknown;
    }

    switch (content.toLowerCase()) {
      case 'article':
        return PageType.Article;
      case 'book':
        return PageType.Book;
      case 'profile':
        return PageType.Profile;
      case 'website':
        return PageType.Website;
      case 'tweet':
        return PageType.Tweet;
      case 'image':
        return PageType.Image;
      default:
        if (content.toLowerCase().startsWith('video')) {
          return PageType.Video;
        }
        return PageType.Unknown;
    }
  } catch (error) {
    logger.error('Error extracting og:type from content', error);
    return PageType.Unknown;
  }
};

const getPurifiedContent = (html: string): Document => {
  const newWindow = parseHTML('');
  const DOMPurify = createDOMPurify(newWindow);
  DOMPurify.addHook('uponSanitizeElement', domPurifySanitizeHook);
  const clean = DOMPurify.sanitize(html, DOM_PURIFY_CONFIG);
  return parseHTML(clean).document;
};

const getReadabilityResult = async (
  url: string,
  html: string,
  document?: Document,
  isNewsletter?: boolean
): Promise<Readability.ParseResult | null> => {
  // First attempt to read the article as is.
  // if that fails attempt to purify then read
  const sources = [
    () => {
      return document;
    },
    () => {
      return getPurifiedContent(html);
    },
  ];

  for (const source of sources) {
    const document = source();
    if (!document) {
      continue;
    }

    try {
      const article = await new Readability(document, {
        debug: DEBUG_MODE,
        // createImageProxyUrl,
        keepTables: isNewsletter,
        ignoreLinkDensity: isNewsletter,
        url,
      }).parse();

      if (article) {
        return article;
      }
    } catch (error) {
      logger.info('parsing error for url', { url, error });
    }
  }

  return null;
};

export const parsePreparedContent = async (
  url: string,
  preparedDocument: PreparedDocument,
  isNewsletter?: boolean,
  allowRetry = true
): Promise<ParsedContentPuppeteer> => {
  const logRecord: ArticleParseLogRecord = {
    url: url,
    labels: { source: 'parsePreparedContent' },
  };

  const { content, pageInfo } = preparedDocument;
  if (!content) {
    logger.info('No document');
    return {
      canonicalUrl: url,
      parsedContent: null,
      pageType: PageType.Unknown,
    };
  }

  // Checking for content type acceptance or if there are no contentType
  // at all (backward extension versions compatibility)
  if (
    pageInfo.contentType &&
    !ALLOWED_CONTENT_TYPES.includes(pageInfo.contentType)
  ) {
    logger.info(`Not allowed content type: ${pageInfo.contentType}`);
    return {
      canonicalUrl: url,
      parsedContent: null,
      pageType: PageType.Unknown,
    };
  }

  const { title: pageInfoTitle, canonicalUrl } = pageInfo;

  let parsedContent: Readability.ParseResult | null = null;
  let pageType = PageType.Unknown;

  try {
    const document = parseHTML(content).document;
    pageType = parseOriginalContent(document);

    // Run readability
    await preParseContent(url, document);

    parsedContent = await getReadabilityResult(
      url,
      content,
      document,
      isNewsletter
    );

    if (!parsedContent || !parsedContent.content) {
      logger.info('No parsed content');

      if (allowRetry) {
        logger.info('Retrying with content wrapped in html body');

        const newDocument = {
          ...preparedDocument,
          document: '<html><body>' + content + '</body></html>', // wrap in body
        };
        return parsePreparedContent(url, newDocument, isNewsletter, false);
      }

      return {
        canonicalUrl,
        parsedContent,
        pageType,
      };
    }

    // use title if not found after running readability
    if (!parsedContent.title && pageInfoTitle) {
      parsedContent.title = pageInfoTitle;
    }

    const newDocumentElement = parsedContent.documentElement;
    // Format code blocks
    // TODO: we probably want to move this type of thing
    // to the handlers, and have some concept of postHandle
    const codeBlocks = newDocumentElement.querySelectorAll(
      'pre[class^="prism-"], pre[class^="language-"], code'
    );
    codeBlocks.forEach(e => {
      if (!e.textContent) {
        return e.parentNode?.removeChild(e);
      }

      // replace <br> or <p> or </p> with \n
      e.innerHTML = e.innerHTML.replace(/<(br|p|\/p)>/g, '\n');

      const att = hljs.highlightAuto(e.textContent);
      const code = document.createElement('code');
      const langClass =
        `hljs language-${att.language}` +
        (att.second_best?.language
          ? ` language-${att.second_best?.language}`
          : '');
      code.setAttribute('class', langClass);
      code.innerHTML = att.value;
      e.replaceWith(code);
    });

    const ANCHOR_ELEMENTS_BLOCKED_ATTRIBUTES = [
      'omnivore-highlight-id',
      'data-twitter-tweet-id',
      'data-instagram-id',
    ];

    // Get the top level element?
    // const pageNode = newDocumentElement.firstElementChild as HTMLElement
    const nodesToVisitStack: [HTMLElement] = [newDocumentElement];
    const visitedNodeList = [];

    while (nodesToVisitStack.length > 0) {
      const currentNode = nodesToVisitStack.pop();
      if (
        currentNode?.nodeType !== 1 ||
        // Avoiding dynamic elements from being counted as anchor-allowed elements
        ANCHOR_ELEMENTS_BLOCKED_ATTRIBUTES.some(attrib =>
          currentNode.hasAttribute(attrib)
        )
      ) {
        continue;
      }
      visitedNodeList.push(currentNode);
      [].slice
        .call(currentNode.childNodes)
        .reverse()
        .forEach(function (node) {
          nodesToVisitStack.push(node);
        });
    }

    visitedNodeList.shift();
    visitedNodeList.forEach((node, index) => {
      // start from index 1, index 0 reserved for anchor unknown.
      node.setAttribute('data-omnivore-anchor-idx', (index + 1).toString());
    });

    const newHtml = newDocumentElement.outerHTML;
    const newWindow = parseHTML('');
    const DOMPurify = createDOMPurify(newWindow);
    DOMPurify.addHook('uponSanitizeElement', domPurifySanitizeHook);
    const cleanHtml = DOMPurify.sanitize(newHtml, DOM_PURIFY_CONFIG);
    parsedContent.content = cleanHtml;

    logRecord.parseSuccess = true;
  } catch (error) {
    logger.error('Error parsing content', error);

    Object.assign(logRecord, {
      parseSuccess: false,
      parseError: error,
    });
  }

  logger.info('parse-article completed', logRecord);

  return {
    canonicalUrl,
    parsedContent,
    pageType,
  };
};

type Metadata = {
  title?: string;
  author?: string;
  description: string;
  previewImage: string;
};

export const parsePageMetadata = (html: string): Metadata | undefined => {
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
    logger.info('failed to parse page:', e);
    return undefined;
  }
};
