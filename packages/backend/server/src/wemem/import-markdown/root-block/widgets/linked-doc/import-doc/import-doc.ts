import {
  type DocCollection,
  extMimeMap,
  type JobMiddleware,
} from '@blocksuite/store';
import { Job } from '@blocksuite/store';
import JSZip from 'jszip';

import { MarkdownAdapter } from '../../../../_common/adapters/markdown.js';
import { NotionHtmlAdapter } from '../../../../_common/adapters/notion-html.js';
import { sha } from '../../../../_common/adapters/utils.js';
import { defaultImageProxyMiddleware } from '../../../../_common/transformers/middlewares.js';

export async function importMarkDown(
  collection: DocCollection,
  text: string,
  fileName?: string,
  jobMiddleware?: JobMiddleware
) {
  const fileNameMiddleware: JobMiddleware = ({ slots }) => {
    slots.beforeImport.on(payload => {
      if (payload.type !== 'page') {
        return;
      }
      if (!fileName) {
        return;
      }
      payload.snapshot.meta.title = fileName;
      payload.snapshot.blocks.props.title = {
        '$blocksuite:internal:text$': true,
        delta: [
          {
            insert: fileName,
          },
        ],
      };
    });
  };
  const middlewares = [defaultImageProxyMiddleware, fileNameMiddleware];
  if (jobMiddleware) {
    middlewares.push(jobMiddleware);
  }
  const job = new Job({
    collection,
    middlewares,
  });
  const mdAdapter = new MarkdownAdapter(job);
  const page = await mdAdapter.toDoc({
    file: text,
    assets: job.assetsManager,
  });

  return page?.id;
}

export async function importHtml(collection: DocCollection, text: string) {
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const htmlAdapter = new NotionHtmlAdapter(job);
  const snapshot = await htmlAdapter.toDocSnapshot({
    file: text,
    assets: job.assetsManager,
  });
  const page = await job.snapshotToDoc(snapshot);
  return page?.id;
}

export async function importNotion(collection: DocCollection, file: File) {
  const pageIds: string[] = [];
  let isWorkspaceFile = false;
  let hasMarkdown = false;
  const parseZipFile = async (file: File | Blob) => {
    const zip = new JSZip();
    const zipFile = await zip.loadAsync(file);
    const pageMap = new Map<string, string>();
    const files = Object.keys(zipFile.files);
    const promises: Promise<void>[] = [];
    const pendingAssets = new Map<string, Blob>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.startsWith('__MACOSX/')) continue;

      const lastSplitIndex = file.lastIndexOf('/');

      const fileName = file.substring(lastSplitIndex + 1);
      if (fileName.endsWith('.md')) {
        hasMarkdown = true;
        continue;
      }
      if (fileName.endsWith('.html')) {
        if (file.endsWith('/index.html')) {
          isWorkspaceFile = true;
          continue;
        }
        if (lastSplitIndex !== -1) {
          const text = await zipFile.files[file].async('text');
          const doc = new DOMParser().parseFromString(text, 'text/html');
          const pageBody = doc.querySelector('.page-body');
          if (pageBody && pageBody.children.length === 0) {
            // Skip empty pages
            continue;
          }
        }
        pageMap.set(file, collection.idGenerator());
        continue;
      }
      if (i === 0 && fileName.endsWith('.csv')) {
        window.open(
          'https://affine.pro/blog/import-your-data-from-notion-into-affine',
          '_blank'
        );
        continue;
      }
      if (fileName.endsWith('.zip')) {
        const innerZipFile = await zipFile.file(fileName)?.async('blob');
        if (innerZipFile) {
          promises.push(...(await parseZipFile(innerZipFile)));
        }
        continue;
      }
      const blob = await zipFile.files[file].async('blob');
      const ext = file.split('.').at(-1) ?? '';
      const mime = extMimeMap.get(ext) ?? '';
      pendingAssets.set(
        await sha(await blob.arrayBuffer()),
        new File([blob], fileName, { type: mime })
      );
    }
    const pagePromises = Array.from(pageMap.keys()).map(async file => {
      const job = new Job({
        collection: collection,
        middlewares: [defaultImageProxyMiddleware],
      });
      const htmlAdapter = new NotionHtmlAdapter(job);
      const assets = job.assetsManager.getAssets();
      for (const [key, value] of pendingAssets.entries()) {
        if (!assets.has(key)) {
          assets.set(key, value);
        }
      }
      const page = await htmlAdapter.toDoc({
        file: await zipFile.files[file].async('text'),
        pageId: pageMap.get(file),
        pageMap,
        assets: job.assetsManager,
      });
      pageIds.push(page?.id ?? '');
    });
    promises.push(...pagePromises);
    return promises;
  };
  const allPromises = await parseZipFile(file);
  await Promise.all(allPromises.flat());
  return { pageIds, isWorkspaceFile, hasMarkdown };
}
