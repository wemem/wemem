/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { preHandleContent } from '@wemem/content-handler';
import axios from 'axios';
import { parseHTML } from 'linkedom';
import path from 'path';
import { BrowserContext, Page, Protocol } from 'puppeteer-core';
import { getBrowser } from './browser';

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4372.0 Safari/537.36';
const NON_BOT_DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4372.0 Safari/537.36';
const NON_BOT_HOSTS = ['bloomberg.com', 'forbes.com'];
const NON_SCRIPT_HOSTS = ['medium.com', 'fastcompany.com', 'fortelabs.com'];

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/octet-stream',
  'text/plain',
  'application/pdf',
];
const REQUEST_TIMEOUT = 30000;

const userAgentForUrl = (url: string) => {
  try {
    const u = new URL(url);
    for (const host of NON_BOT_HOSTS) {
      if (u.hostname.endsWith(host)) {
        return NON_BOT_DESKTOP_USER_AGENT;
      }
    }
  } catch (e) {
    console.log('error getting user agent for url', url, e);
  }
  return DESKTOP_USER_AGENT;
};

const fetchContentWithScrapingBee = async (url: string) => {
  const response = await axios.get('https://app.scrapingbee.com/api/v1', {
    params: {
      api_key: process.env.SCRAPINGBEE_API_KEY,
      url: url,
      render_js: 'false',
      premium_proxy: 'true',
      country_code: 'us',
    },
    timeout: REQUEST_TIMEOUT,
  });

  const dom = parseHTML(response.data).document;
  return { title: dom.title, domContent: dom.documentElement.outerHTML, url };
};

const enableJavascriptForUrl = (url: string) => {
  try {
    const u = new URL(url);
    for (const host of NON_SCRIPT_HOSTS) {
      if (u.hostname.endsWith(host)) {
        return false;
      }
    }
  } catch (e) {
    console.log('error getting hostname for url', url, e);
  }
  return true;
};

export const fetchContent = async (
  url: string,
  locale?: string,
  timezone?: string
) => {
  const functionStartTime = Date.now();
  const logRecord = {
    url,
    functionStartTime,
    locale,
    timezone,
  };
  console.log(`content-fetch request`, logRecord);

  let context: BrowserContext | undefined,
    page: Page | undefined,
    title: string | undefined,
    content: string | undefined,
    contentType: string | undefined;

  try {
    url = getUrl(url);
    if (!url) {
      throw new Error('Valid URL to parse not specified');
    }

    // pre handle url with custom handlers
    try {
      const result = await preHandleContent(url);
      if (result && result.url) {
        validateUrlString(url);
        url = result.url;
      }
      if (result && result.title) {
        title = result.title;
      }
      if (result && result.content) {
        content = result.content;
      }
      if (result && result.contentType) {
        contentType = result.contentType;
      }
    } catch (e) {
      console.info('error with handler: ', e);
    }

    if ((!content || !title) && contentType !== 'application/pdf') {
      const result = await retrievePage(
        url,
        logRecord,
        functionStartTime,
        locale,
        timezone
      );
      if (result && result.context) {
        context = result.context;
      }
      if (result && result.page) {
        page = result.page;
      }
      if (result && result.finalUrl) {
        url = result.finalUrl;
      }
      if (result && result.contentType) {
        contentType = result.contentType;
      }
    }

    if (contentType !== 'application/pdf') {
      if (page && (!content || !title)) {
        const result = await retrieveHtml(page, logRecord);
        if (result.isBlocked) {
          const sbResult = await fetchContentWithScrapingBee(url);
          title = sbResult.title;
          content = sbResult.domContent;
        } else {
          title = result.title;
          content = result.domContent;
        }
      } else {
        console.info('using prefetched content and title');
      }
    }
  } catch (e) {
    console.error(`Error while retrieving page ${url}`, e);

    // fallback to scrapingbee for non pdf content
    if (url && contentType !== 'application/pdf') {
      console.info('fallback to scrapingbee', url);

      const sbResult = await fetchContentWithScrapingBee(url);

      return {
        finalUrl: url,
        title: sbResult.title,
        content: sbResult.domContent,
        contentType,
      };
    }

    throw e;
  } finally {
    // close browser context if it was opened
    if (context) {
      console.info('closing context...', url);
      await context.close();
      console.info('context closed', url);
    }

    console.info(`content-fetch result`, logRecord);
  }

  return { finalUrl: url, title, content, contentType };
};

function validateUrlString(url: string) {
  const u = new URL(url);
  // Make sure the URL is http or https
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Invalid URL protocol check failed');
  }
  // Make sure the domain is not localhost
  if (u.hostname === 'localhost' || u.hostname === '0.0.0.0') {
    throw new Error('Invalid URL is localhost');
  }
  // Make sure the domain is not a private IP
  if (/^(10|172\.16|192\.168)\..*/.test(u.hostname)) {
    throw new Error('Invalid URL is private ip');
  }
}

function tryParseUrl(urlStr: string) {
  if (!urlStr) {
    return null;
  }

  // a regular expression to match all URLs
  const regex = /(https?:\/\/[^\s]+)/g;

  const matches = urlStr.match(regex);

  if (matches) {
    return matches[0]; // only return first match
  } else {
    return null;
  }
}

function getUrl(urlStr: string) {
  const url = tryParseUrl(urlStr);
  if (!url) {
    throw new Error('No URL specified');
  }

  validateUrlString(url);

  const parsed = new URL(url);
  return parsed.href;
}

async function retrievePage(
  url: string,
  logRecord: Record<string, any>,
  functionStartTime: number,
  locale?: string,
  timezone?: string
) {
  validateUrlString(url);

  logRecord.timing = {
    ...logRecord.timing,
    browserOpened: Date.now() - functionStartTime,
  };

  const browser = await getBrowser();
  // create a new incognito browser context
  const context = await browser.createBrowserContext();

  // Puppeteer fails during download of PDf files,
  // so record the failure and use those items
  let lastPdfUrl;
  let page;
  try {
    page = await context.newPage();

    if (!enableJavascriptForUrl(url)) {
      await page.setJavaScriptEnabled(false);
    }
    await page.setUserAgent(userAgentForUrl(url));

    // set locale for the page
    if (locale) {
      await page.setExtraHTTPHeaders({ 'Accept-Language': locale });
    }

    // set timezone for the page
    if (timezone) {
      await page.emulateTimezone(timezone);
    }

    const client = await page.createCDPSession();

    const downloadPath = path.resolve('./download_dir/');
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath,
    });

    // intercept request when response headers was received
    await client.send('Network.setRequestInterception', {
      patterns: [
        {
          urlPattern: '*',
          resourceType: 'Document',
          interceptionStage: 'HeadersReceived',
        },
      ],
    });

    client.on(
      'Network.requestIntercepted',
      (e: Protocol.Network.RequestInterceptedEvent) => {
        (async () => {
          const headers = e.responseHeaders || {};

          const [contentType] = (
            headers['content-type'] ||
            headers['Content-Type'] ||
            ''
          )
            .toLowerCase()
            .split(';');
          const obj: Protocol.Network.ContinueInterceptedRequestRequest = {
            interceptionId: e.interceptionId,
          };

          if (
            e.responseStatusCode &&
            e.responseStatusCode >= 200 &&
            e.responseStatusCode < 300
          ) {
            // We only check content-type on success responses
            // as it doesn't matter what the content type is for things
            // like redirects
            if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
              obj['errorReason'] = 'BlockedByClient';
            }
          }

          try {
            await client.send('Network.continueInterceptedRequest', obj);
          } catch {
            // ignore
          }
        })();
      }
    );

    /*
     * Disallow MathJax from running in Puppeteer and modifying the document,
     * we shall instead run it in our frontend application to transform any
     * mathjax content when present.
     */
    await page.setRequestInterception(true);
    let requestCount = 0;
    page.on('request', request => {
      (async () => {
        if (request.resourceType() === 'font') {
          // Disallow fonts from loading
          return request.abort();
        }
        if (requestCount++ > 100) {
          return request.abort();
        }
        if (
          request.resourceType() === 'script' &&
          request.url().toLowerCase().indexOf('mathjax') > -1
        ) {
          return request.abort();
        }

        await request.continue();
      })();
    });

    page.on('response', response => {
      if (response.headers()['content-type'] === 'application/pdf') {
        lastPdfUrl = response.url();
      }
    });

    const response = await page.goto(url, {
      timeout: 30 * 1000,
      waitUntil: ['networkidle2'],
    });
    if (!response) {
      throw new Error('No response from page');
    }

    const finalUrl = response.url();
    const contentType = response.headers()['content-type'];

    logRecord.finalUrl = finalUrl;
    logRecord.contentType = contentType;

    return { context, page, finalUrl, contentType };
  } catch (error) {
    if (lastPdfUrl) {
      return {
        context,
        page,
        finalUrl: lastPdfUrl,
        contentType: 'application/pdf',
      };
    }
    await context.close();
    throw error;
  }
}

async function retrieveHtml(page: Page, logRecord: Record<string, any>) {
  let domContent, title;
  try {
    title = await page.title();
    logRecord.title = title;

    const pageScrollingStart = Date.now();
    /* scroll with a 5 seconds timeout */
    try {
      await Promise.race([
        page.evaluate(
          `(async () => {
                /* credit: https://github.com/puppeteer/puppeteer/issues/305 */
                return new Promise((resolve, reject) => {
                  let scrollHeight = document.body.scrollHeight;
                  let totalHeight = 0;
                  let distance = 500;
                  let timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if(totalHeight >= scrollHeight){
                      clearInterval(timer);
                      resolve(true);
                    }
                  }, 10);
                });
              })()`
        ),
        new Promise(r => setTimeout(r, 5000)),
      ]);
    } catch (error) {
      console.error('Error scrolling page', error);
      logRecord.scrollError = true;
    }

    logRecord.timing = {
      ...logRecord.timing,
      pageScrolled: Date.now() - pageScrollingStart,
    };

    const iframes: Record<string, any> = {};
    const urls: string[] = [];
    const framesPromises = [];
    const allowedUrls = /instagram\.com/gi;

    for (const frame of page.mainFrame().childFrames()) {
      if (frame.url() && allowedUrls.test(frame.url())) {
        urls.push(frame.url());
        framesPromises.push(
          frame.evaluate(el => el?.innerHTML, await frame.$('body'))
        );
      }
    }

    (await Promise.all(framesPromises)).forEach(
      (frame, index) => (iframes[urls[index]] = frame)
    );

    const domContentCapturingStart = Date.now();
    // get document body with all hidden elements removed
    domContent = await page.evaluate(iframes => {
      const BI_SRC_REGEXP = /url\("(.+?)"\)/gi;

      Array.from(document.body.getElementsByTagName('*')).forEach(el => {
        const style = window.getComputedStyle(el);
        const src = el.getAttribute('src');

        try {
          // Removing blurred images since they are mostly the copies of lazy loaded ones
          if (
            el.tagName &&
            ['img', 'image'].includes(el.tagName.toLowerCase())
          ) {
            const filter = style.getPropertyValue('filter');
            if (filter && filter.startsWith('blur')) {
              el.parentNode && el.parentNode.removeChild(el);
            }
          }
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          // throw Error('error with element: ' + JSON.stringify(Array.from(document.body.getElementsByTagName('*'))))
        }

        // convert all nodes with background image to img nodes
        if (
          !['', 'none'].includes(style.getPropertyValue('background-image'))
        ) {
          const filter = style.getPropertyValue('filter');
          // avoiding image nodes with a blur effect creation
          if (filter && filter.startsWith('blur')) {
            el && el.parentNode && el.parentNode.removeChild(el);
          } else {
            const matchedSRC = BI_SRC_REGEXP.exec(
              style.getPropertyValue('background-image')
            );
            // Using "g" flag with a regex we have to manually break down lastIndex to zero after every usage
            // More details here: https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
            BI_SRC_REGEXP.lastIndex = 0;

            if (matchedSRC && matchedSRC[1] && !src) {
              // Replacing element only of there are no content inside, b/c might remove important div with content.
              // Article example: http://www.josiahzayner.com/2017/01/genetic-designer-part-i.html
              // DIV with class "content-inner" has `url("https://resources.blogblog.com/blogblog/data/1kt/travel/bg_container.png")` background image.
              if (!el.textContent) {
                const img = document.createElement('img');
                img.src = matchedSRC[1];
                el && el.parentNode && el.parentNode.replaceChild(img, el);
              }
            }
          }
        }

        if (el.tagName === 'IFRAME') {
          if (src && iframes[src]) {
            const newNode = document.createElement('div');
            newNode.className = 'omnivore-instagram-embed';
            newNode.innerHTML = iframes[src];
            el && el.parentNode && el.parentNode.replaceChild(newNode, el);
          }
        }
      });

      if (
        document.querySelector('[data-translate="managed_checking_msg"]') ||
        document.getElementById('px-block-form-wrapper')
      ) {
        return 'IS_BLOCKED';
      }

      return document.documentElement.outerHTML;
    }, iframes);
    logRecord.puppeteerSuccess = true;
    logRecord.timing = {
      ...logRecord.timing,
      contenCaptured: Date.now() - domContentCapturingStart,
    };

    // [END puppeteer-block]
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.startsWith('net::ERR_BLOCKED_BY_CLIENT at ')) {
        logRecord.blockedByClient = true;
      } else {
        logRecord.puppeteerSuccess = false;
        logRecord.puppeteerError = {
          message: e.message,
          stack: e.stack,
        };
      }
    } else {
      logRecord.puppeteerSuccess = false;
      logRecord.puppeteerError = e;
    }

    throw e;
  }
  if (domContent === 'IS_BLOCKED') {
    return { isBlocked: true };
  }
  return { domContent, title };
}
