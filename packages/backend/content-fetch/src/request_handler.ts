import { fetchContent } from './puppeteer-parse';
import 'dotenv/config';
import type { RequestHandler } from 'express';
import {
  PutObjectCommand,
  S3Client,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { urlToSha256 } from './uitl/url_to_sha265';
import { parseMarkdown } from './html-to-markdown';

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

interface FetchContentResult {
  finalPageUrl: string;
  title: string;
  contentType: string;
  originalFilePath: string;
  metadataFilePath: string;
  markdownFilePath: string;
}

interface OriginalContentMetadata {
  url: string;
  title?: string;
  finalUrl: string;
  originalFilePath: string;
  metadataFilePath: string;
  markdownFilePath: string;
  contentType?: string;
}

// 添加环境变量验证
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

// 初始化 S3 客户端
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
  const filePath = await urlToSha256(url);
  const originalFilePath = `${filePath}.original`;
  const metadataFilePath = `${filePath}.metadata`;
  const markdownFilePath = `${filePath}.markdown`;
  const metadata: OriginalContentMetadata = {
    url,
    title,
    finalUrl,
    originalFilePath,
    metadataFilePath,
    markdownFilePath,
    contentType,
  };

  console.log(`Original content from ${url} uploading to ${filePath}`);

  const markdown = await parseMarkdown(content);

  const uploadCommands = [
    // metadata
    new PutObjectCommand({
      Bucket: bucketName,
      Key: metadataFilePath,
      Body: JSON.stringify(metadata),
      ACL: 'private',
    }),
    // content
    new PutObjectCommand({
      Bucket: bucketName,
      Key: originalFilePath,
      Body: content,
      ACL: 'private',
    }),
    // markdown
    new PutObjectCommand({
      Bucket: bucketName,
      Key: markdownFilePath,
      Body: markdown,
      ACL: 'private',
    }),
  ];

  try {
    await Promise.all(uploadCommands.map(command => S3.send(command)));

    console.log(`Original content uploaded successfully`);
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
              { Key: originalFilePath },
              { Key: markdownFilePath },
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
): Promise<OriginalContentMetadata | null> => {
  const filePathSha256 = await urlToSha256(url);
  const metadataFilePath = `${filePathSha256}.metadata`;
  try {
    // 验证 S3 客户端状态
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
    return metadata as OriginalContentMetadata;
  } catch (err) {
    // 改进错误处理
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

    return res.status(200).json({
      finalPageUrl: metadata.finalUrl,
      title: metadata.title,
      contentType: metadata.contentType,
      originalFilePath: metadata.originalFilePath,
      metadataFilePath: metadata.metadataFilePath,
      markdownFilePath: metadata.markdownFilePath,
    } as FetchContentResult);
  } catch (error) {
    console.error(
      'error fetching content',
      error instanceof Error ? error.stack : error
    );
    return res.sendStatus(500);
  } finally {
    const totalTime = Date.now() - functionStartTime;
    console.log('fetch content request completed', totalTime);
  }
};
