import * as crypto from 'crypto';

const isNode =
  typeof process !== 'undefined' && process.versions && process.versions.node;

/**
 * Convert a URL to an MD5 hash
 * @param url - The URL to convert
 * @returns The MD5 hash of the URL
 */
export const md5 = async (url: string): Promise<string> => {
  if (isNode) {
    // Node.js environment
    return crypto.createHash('md5').update(url).digest('hex');
  } else {
    // Cloudflare Workers environment
    const encoder = new TextEncoder();
    const urlBuffer = encoder.encode(url);
    const hashBuffer = await crypto.subtle.digest('MD5', urlBuffer);

    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
};
