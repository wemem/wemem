/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import crypto from 'node:crypto';
import path from 'node:path';

import { countWords } from 'alfaaz';
import Redis from 'ioredis';
import { parseHTML } from 'linkedom';
import normalizeUrl from 'normalize-url';
import slugify from 'slugify';
import _ from 'underscore';

import { logger } from './logger';
import { validateUrl } from './validate';

interface InputObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const TWEET_URL_REGEX =
  /twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)(?:\/.*)?/;

export const keysToCamelCase = (object: InputObject): InputObject => {
  Object.keys(object).forEach(key => {
    const parts = key.split('_');
    if (parts.length <= 1) return;

    const newKey =
      parts[0] +
      parts
        .slice(1)
        .map(p => p[0].toUpperCase() + p.slice(1))
        .join('');
    delete Object.assign(object, { [newKey]: object[key] })[key];
  });
  return object;
};

/**
 * Generates uuid using MD5 hash from the specified string
 * @param str - string to generate UUID from
 * @example
 * // returns "a3dcb4d2-29de-6fde-0db5-686dee47145d"
 * return uuidWithMd5('test')
 */
export const stringToHash = (str: string, convertToUUID = false): string => {
  const md5Hash = crypto.createHash('md5').update(str).digest('hex');
  if (!convertToUUID) return md5Hash;
  return (
    md5Hash.substring(0, 8) +
    '-' +
    md5Hash.substring(8, 12) +
    '-' +
    md5Hash.substring(12, 16) +
    '-' +
    md5Hash.substring(16, 20) +
    '-' +
    md5Hash.substring(20)
  ).toLowerCase();
};

export const findDelimiter = (
  text: string,
  delimiters = ['\t', ',', ':', ';'],
  defaultDelimiter = '\t'
): string => {
  const textChunk = text
    // remove escaped sections that can contain false-positive delimiters
    .replace(/"(.|\n)*?"/gm, '')
    .split('\n')
    .slice(0, 5);
  const delimiter = delimiters.find(delimiter =>
    textChunk.every(
      (row, _, array) =>
        row.split(delimiter).length === array[0].split(delimiter).length &&
        row.split(delimiter).length !== 1
    )
  );

  return delimiter || defaultDelimiter;
};

export const generateSlug = (title: string): string => {
  return slugify(title).substring(0, 64) + '-' + Date.now().toString(16);
};

export const MAX_CONTENT_LENGTH = 5e7; //50MB

export const validatedDate = (
  date: Date | string | undefined
): Date | undefined => {
  try {
    if (typeof date === 'string') {
      // Sometimes readability returns a string for the date
      date = new Date(date);
    }

    if (!date) return undefined;
    // Make sure the date year is not greater than 9999
    if (date.getFullYear() > 9999) {
      return undefined;
    }
    return new Date(date);
  } catch (e) {
    logger.error('error validating date', { date, error: e });
    return undefined;
  }
};

export const fileNameForFilePath = (urlStr: string): string => {
  const url = normalizeUrl(new URL(urlStr).href, {
    stripHash: true,
    stripWWW: false,
  });
  const fileName = decodeURI(path.basename(new URL(url).pathname)).replace(
    /[^a-zA-Z0-9-_.]/g,
    ''
  );
  return fileName;
};

export const titleForFilePath = (url: string): string => {
  try {
    const title = decodeURI(path.basename(new URL(url).pathname, '.pdf'));
    return title;
  } catch (e) {
    logger.error(e);
  }
  return url;
};

export const validateUuid = (str: string): boolean => {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return regexExp.test(str);
};

export const isString = (check: any): check is string => {
  return typeof check === 'string' || check instanceof String;
};

export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

export const wordsCount = (text: string, isHtml?: boolean): number => {
  try {
    if (isHtml) {
      const dom = parseHTML(text).window.document;
      text = dom.body.textContent || '';
    }

    return countWords(text);
  } catch {
    return 0;
  }
};

export const isBase64Image = (str: string): boolean => {
  return str.startsWith('data:image/');
};

export const generateRandomColor = (): string => {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()
  );
};

export const unescapeHtml = (html: string): string => {
  return _.unescape(html);
};

export const isUrl = (str: string): boolean => {
  try {
    validateUrl(str);
    return true;
  } catch {
    logger.log('not an url', { url: str });
    return false;
  }
};

export const cleanUrl = (url: string) => {
  const trackingParams: (RegExp | string)[] = [/^utm_\w+/i]; // remove utm tracking parameters
  if (TWEET_URL_REGEX.test(url)) {
    // remove tracking parameters from tweet links:
    // https://twitter.com/omnivore/status/1673218959624093698?s=12&t=R91quPajs0E53Yds-fhv2g
    trackingParams.push('s', 't');
  }
  return normalizeUrl(url, {
    stripHash: true,
    stripWWW: false,
    removeQueryParameters: trackingParams,
    removeTrailingSlash: false,
  });
};

export const deepDelete = <T, K extends keyof T>(
  obj: T,
  keys: readonly K[]
) => {
  // make a copy of the object
  const copy = { ...obj };

  keys.forEach(key => {
    delete copy[key];
  });

  return copy as Omit<T, K>;
};

export const isRelativeUrl = (url: string): boolean => {
  return url.startsWith('/');
};

export const getAbsoluteUrl = (url: string, baseUrl: string): string => {
  return new URL(url, baseUrl).href;
};

export const getClientFromUserAgent = (userAgent: string): string => {
  // for plugins, currently only obsidian and logseq are supported
  const plugins = userAgent.match(/(obsidian|logseq)/i);
  if (plugins) return plugins[0].toLowerCase();

  // web browser
  const browsers = userAgent.match(/(chrome|safari|firefox|edge|opera)/i);
  if (browsers) return 'web';

  return 'other';
};
