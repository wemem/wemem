import { fetchContent } from './puppeteer-parse';
import 'dotenv/config';
import type { RequestHandler } from 'express';
import {
  PutObjectCommand,
  S3Client,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { md5 } from './uitl/md5';
import { parseMarkdown } from './html-to-markdown';
import { parsePreparedContent } from './readability';
import { Readability } from '@wemem/readability';
import JSZip from 'jszip';

interface UserConfig {
  userId: string;
  pageId: string;
  workspaceId: string;
}

export interface FetchContentRequestBody {
  pageUrl: string;
  traceId: string;
  state?: string;
  source?: string;
  taskId?: string;
  locale?: string;
  timezone?: string;
  feedUrl?: string;
  savedAt?: string;
  publishedAt?: string;
  users: UserConfig[];
}

export type ContentMetadata = {
  url: string;
  title?: string;
  finalUrl: string;
  originalZipPath: string;
  metadataFilePath: string;
  markdownZipPath: string;
  contentType?: string;
} & Omit<
  Readability.ParseResult,
  'documentElement' | 'content' | 'textContent'
>;

// check env variables
const validateEnvVariables = () => {
  const required = [
    'CF_R2_ENDPOINT',
    'CF_R2_ACCESS_KEY_ID',
    'CF_R2_SECRET_ACCESS_KEY',
  ];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// init s3 client
const initS3Client = () => {
  validateEnvVariables();

  return new S3Client({
    region: 'auto',
    endpoint: process.env.CF_R2_ENDPOINT as string,
    credentials: {
      accessKeyId: process.env.CF_R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY as string,
    },
  });
};

const S3 = initS3Client();

const bucketName =
  process.env.AFFINE_ENV === 'canary'
    ? 'page-content-canary'
    : 'page-content-prod';

const uploadOriginalContentToBucket = async (
  url: string,
  content: string,
  finalUrl: string,
  title: string | undefined,
  contentType: string | undefined
) => {
  const checksum = await md5(url);
  const originalZipPath = `${checksum}_original.zip`;
  const markdownZipPath = `${checksum}_markdown.zip`;
  const metadataFilePath = `${checksum}_metadata.json`;

  console.log(`Creating zip files for content from ${url}`);

  const parsedContent = await parsePreparedContent(url, {
    content,
    pageInfo: {
      canonicalUrl: finalUrl,
      title,
      contentType,
    },
  });

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars content too large not save to storage
    documentElement,
    content: cleanContent,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars textContent too large not save to storage
    textContent,
    ...rest
  } = parsedContent.parsedContent || {};

  const markdown = await parseMarkdown(cleanContent);

  // create original content zip
  const originalZip = new JSZip();
  originalZip.file('content.html', content);
  const originalZipContent = await originalZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  // create markdown content zip
  const markdownZip = new JSZip();
  markdownZip.file('content.md', markdown);
  const markdownZipContent = await markdownZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  // @ts-ignore
  const metadata: ContentMetadata = {
    url,
    finalUrl,
    originalZipPath,
    metadataFilePath,
    markdownZipPath,
    contentType,
    ...rest,
  };

  const uploadCommands = [
    // metadata
    new PutObjectCommand({
      Bucket: bucketName,
      Key: metadataFilePath,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
      ACL: 'private',
    }),
    // original content zip
    new PutObjectCommand({
      Bucket: bucketName,
      Key: originalZipPath,
      Body: originalZipContent,
      ContentType: 'application/zip',
      ACL: 'private',
    }),
    // markdown content zip
    new PutObjectCommand({
      Bucket: bucketName,
      Key: markdownZipPath,
      Body: markdownZipContent,
      ContentType: 'application/zip',
      ACL: 'private',
    }),
  ];

  try {
    await Promise.all(uploadCommands.map(command => S3.send(command)));
    console.log(`Content uploaded successfully`);
    return metadata;
  } catch (error) {
    console.error('Upload failed:', error);
    try {
      await S3.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: [
              { Key: metadataFilePath },
              { Key: originalZipPath },
              { Key: markdownZipPath },
            ],
            Quiet: true,
          },
        })
      );
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
    throw error;
  }
};

const getOriginalContentMetadata = async (
  url: string
): Promise<ContentMetadata | null> => {
  const checksum = await md5(url);
  const metadataFilePath = `${checksum}_metadata.json`;
  try {
    // check s3 client status
    if (!S3) {
      throw new Error('S3 client not properly initialized');
    }

    const response = await S3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: metadataFilePath,
      })
    );

    if (!response.Body) {
      return null;
    }

    const chunks = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const bodyContent = Buffer.concat(chunks).toString('utf-8');

    // Parse metadata from object
    const metadata = JSON.parse(bodyContent);
    console.log(`Retrieved original content metadata for: ${url}`);
    return metadata as ContentMetadata;
  } catch (err) {
    // improve error handling
    if (err instanceof Error) {
      if (err.name === 'NoSuchKey') {
        return null;
      }
      console.error(
        `Error retrieving content metadata for url ${url} path ${metadataFilePath}: ${err.message}`
      );
    }
    throw err;
  }
};

export const contentFetchRequestHandler: RequestHandler = async (req, res) => {
  const functionStartTime = Date.now();

  const body = <FetchContentRequestBody>req.body;

  console.log(`fetch content request`, body);

  const pageUrl = body.pageUrl;
  const locale = body.locale;
  const timezone = body.timezone;

  try {
    let metadata = await getOriginalContentMetadata(pageUrl);
    if (!metadata) {
      console.log(
        'fetch result not found in cache, fetching content now...',
        pageUrl
      );

      const fetchResult = await fetchContent(pageUrl, locale, timezone);
      console.log('content has been fetched');
      if (fetchResult.content) {
        const { finalUrl, content, title, contentType } = fetchResult;
        metadata = await uploadOriginalContentToBucket(
          pageUrl,
          content,
          finalUrl,
          title,
          contentType
        );
      } else {
        throw new Error('no content found in fetch result');
      }
    }

    return res.status(200).json(metadata);
  } catch (error) {
    console.error(
      'error fetching content',
      error instanceof Error ? error.stack : error
    );
    return res.sendStatus(500);
  } finally {
    const totalTime = Date.now() - functionStartTime;
    console.log(`fetch content request completed in ${totalTime} ms`);
  }
};
