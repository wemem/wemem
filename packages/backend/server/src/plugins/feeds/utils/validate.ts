import * as privateIpLib from 'private-ip';

const isPrivateIP = privateIpLib.default;

export const validateUrl = (url: string): URL => {
  const u = new URL(url);
  // Make sure the URL is http or https
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Invalid URL');
  }
  // Make sure the domain is not localhost
  if (u.hostname === 'localhost' || u.hostname === '0.0.0.0') {
    throw new Error('Invalid URL');
  }
  // Make sure its not a private GCP domain
  if (
    u.hostname === 'metadata.google.internal' ||
    /^169.254.*/.test(u.hostname)
  ) {
    throw new Error('Invalid URL');
  }
  // Make sure the domain is not a private IP
  if (/^(10|172\.16|192\.168)\..*/.test(u.hostname)) {
    throw new Error('Invalid URL');
  }
  if (isPrivateIP(u.hostname)) {
    throw new Error('Invalid URL');
  }
  return u;
};
