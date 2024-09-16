import type { JobMiddleware } from '@blocksuite/store';

import { DEFAULT_IMAGE_PROXY_ENDPOINT } from '../consts.js';

export const customImageProxyMiddleware = (
  imageProxyURL: string
): JobMiddleware => {
  return ({ adapterConfigs }) => {
    adapterConfigs.set('imageProxy', imageProxyURL);
  };
};

export const titleMiddleware: JobMiddleware = ({
  slots,
  collection,
  adapterConfigs,
}) => {
  slots.beforeExport.on(() => {
    for (const meta of collection.meta.docMetas) {
      adapterConfigs.set('title:' + meta.id, meta.title);
    }
  });
};

const imageProxyMiddlewareBuilder = () => {
  let middleware = customImageProxyMiddleware(DEFAULT_IMAGE_PROXY_ENDPOINT);
  return {
    get: () => middleware,
    set: (url: string) => {
      middleware = customImageProxyMiddleware(url);
    },
  };
};

const defaultImageProxyMiddlewarBuilder = imageProxyMiddlewareBuilder();

export const setImageProxyMiddlewareURL = defaultImageProxyMiddlewarBuilder.set;

export const defaultImageProxyMiddleware =
  defaultImageProxyMiddlewarBuilder.get();

export const embedSyncedDocMiddleware =
  (type: 'content'): JobMiddleware =>
  ({ adapterConfigs }) => {
    adapterConfigs.set('embedSyncedDocExportType', type);
  };
