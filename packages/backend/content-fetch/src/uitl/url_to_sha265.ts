import nodeCrypto from 'crypto';

const isNode =
  typeof process !== 'undefined' && process.versions && process.versions.node;

/**
 * Convert a URL to a SHA-256 hash
 * @param url - The URL to convert
 * @returns The SHA-256 hash of the URL
 */
export const urlToSha256 = async (url: string): Promise<string> => {
  if (isNode) {
    // Node.js environment
    return nodeCrypto.createHash('sha256').update(url).digest('hex');
  } else {
    // Cloudflare Workers environment
    const encoder = new TextEncoder();
    const urlBuffer = encoder.encode(url);
    const hashBuffer = await crypto.subtle.digest('SHA-256', urlBuffer);

    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
};
