import { Injectable } from '@nestjs/common';
import { FeedArticleState, PrismaClient, User } from '@prisma/client';

import { TracedLogger } from '../../../fundamentals';
import {
  cleanUrl,
  generateSlug,
  stringToHash,
  validatedDate,
  wordsCount,
} from '../utils/helpers';
import { parsePreparedContent } from '../utils/parser';
import { PageContentStorage } from '@affine/server/core/storage/wrappers/original-content';

// 需要使用 API 获取底层内容的 URL
const FORCE_PUPPETEER_URLS = [
  /twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)(?:\/.*)?/,
  /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/,
];

const ALREADY_PARSED_SOURCES = [
  'puppeteer-parse',
  'csv-importer',
  'rss-feeder',
  'pocket',
];

export interface SavePageJobData {
  userId: string;
  pageUrl: string;
  finalPageUrl: string;
  pageId: string;
  state?: string;
  labels?: string[];
  source: string;
  feedUrl?: string;
  savedAt: string;
  publishedAt?: string;
  taskId?: string;
  title: string;
  contentType: string;
  contentFilePath: string;
  metadataFilePath: string;
}

type SavePageArgs = SavePageJobData & {
  content?: string;
};

export type CreateLabelInput = {
  color?: string;
  description?: string;
  value: string;
};

export type ParseResult = {
  byline?: string;
  content: string;
  dir?: string;
  excerpt: string;
  language?: string;
  length: number;
  previewImage?: string;
  publishedDate?: Date;
  siteIcon?: string;
  siteName?: string;
  textContent: string;
  title: string;
};

@Injectable()
export class SavePageService {
  private readonly logger = new TracedLogger(SavePageService.name);
  constructor(
    private readonly prisma: PrismaClient,
    private readonly pageContentStorage: PageContentStorage
  ) {}

  private createSlug(url: string, title?: string | null | undefined) {
    const { pathname } = new URL(url);
    const croppedPathname = decodeURIComponent(
      pathname
        .split('/')
        [pathname.split('/').length - 1].split('.')
        .slice(0, -1)
        .join('.')
    ).replace(/_/gi, ' ');

    return [generateSlug(title || croppedPathname), croppedPathname];
  }

  private shouldParseInBackend(source: string, url: string): boolean {
    return (
      ALREADY_PARSED_SOURCES.indexOf(source) === -1 &&
      FORCE_PUPPETEER_URLS.some(regex => {
        return regex.test(url);
      })
    );
  }

  async handle(data: SavePageJobData) {
    const {
      userId,
      labels,
      source,
      feedUrl,
      savedAt,
      publishedAt,
      taskId,
      pageUrl,
      finalPageUrl,
      title,
      contentType,
      state,
      contentFilePath,
      metadataFilePath,
    } = data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error('user not found', {
        userId: input.userId,
        pageUrl: input.pageUrl,
      });
      return;
    }

    const content = await this.pageContentStorage.get(contentFilePath);
    this.logger.log('Downloaded original content from:', {
      filePath: contentFilePath,
    });

    return this.savePage(input, user);
  }

  private async savePage(
    input: SavePageJobData,
    user: User
  ): Promise<SaveResult> {
    let clientRequestId = input.clientRequestId;

    // 如果 URL 在强制 puppeteer 列表中,则始终在后端解析
    if (this.shouldParseInBackend(input.source, input.pageUrl)) {
      try {
        await createPageSaveRequest({
          user,
          url: input.url,
          articleSavingRequestId: clientRequestId || undefined,
          state: input.state || undefined,
          labels: input.labels || undefined,
          folder: input.folder || undefined,
        });
      } catch (e) {
        return {
          __typename: 'SaveError',
          errorCodes: [SaveErrorCode.Unknown],
          message: 'Failed to create page save request',
        };
      }

      return {
        clientRequestId,
        url: `${homePageURL()}/${user.profile.username}/${slug}`,
      };
    }

    const preparedDocument: PreparedDocumentInput = {
      document: input.originalContent,
      pageInfo: {
        title: input.title,
        canonicalUrl: input.url,
        previewImage: input.previewImage,
        author: input.author,
      },
    };

    const parseResult = await parsePreparedContent(input.url, preparedDocument);

    const itemToSave = this.parsedContentToLibraryItem({
      itemId: clientRequestId,
      url: input.url,
      title: input.title,
      userId: user.id,
      slug,
      croppedPathname,
      parsedContent: parseResult.parsedContent,
      itemType: parseResult.pageType,
      originalHtml: parseResult.domContent,
      canonicalUrl: parseResult.canonicalUrl,
      savedAt: input.savedAt ? new Date(input.savedAt) : new Date(),
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
      state: input.state || undefined,
      rssFeedUrl: input.rssFeedUrl,
      folder: input.folder,
      feedContent: input.feedContent,
      dir: parseResult.parsedContent?.dir,
      preparedDocument,
      labelNames: input.labels?.map(label => label.name),
      highlightAnnotations: parseResult.highlightData ? [''] : undefined,
    });

    const isImported =
      input.source === 'csv-importer' || input.source === 'pocket';

    // 如果是导入的项目则不发布 pubsub 事件
    const newItem = await createOrUpdateLibraryItem(
      itemToSave,
      user.id,
      undefined,
      isImported,
      input.originalContentUploaded
    );
    clientRequestId = newItem.id;

    // 合并标签
    await createAndAddLabelsToLibraryItem(
      clientRequestId,
      user.id,
      input.labels,
      input.rssFeedUrl
    );

    if (parseResult.highlightData) {
      const highlight: DeepPartial<Highlight> = {
        ...parseResult.highlightData,
        user: { id: user.id },
        libraryItem: { id: clientRequestId },
      };

      // 合并高亮
      try {
        await createHighlight(highlight, clientRequestId, user.id);
      } catch (error) {
        logger.error('Failed to create highlight', {
          highlight,
          clientRequestId,
          userId: user.id,
        });
      }
    }

    return {
      clientRequestId,
      url: `${homePageURL()}/${user.profile.username}/${slug}`,
    };
  }

  // 将解析的内容转换为库项目
  private parsedContentToLibraryItem({
    url,
    userId,
    originalHtml,
    itemId,
    parsedContent,
    slug,
    croppedPathname,
    title,
    preparedDocument,
    canonicalUrl,
    itemType,
    uploadFileHash,
    uploadFileId,
    savedAt,
    publishedAt,
    state,
    rssFeedUrl,
    folder,
    feedContent,
    dir,
    labelNames,
    highlightAnnotations,
  }: {
    url: string;
    userId: string;
    slug: string;
    croppedPathname: string;
    itemType: string;
    parsedContent: Readability.ParseResult | null;
    originalHtml?: string | null;
    itemId?: string | null;
    title?: string | null;
    preparedDocument?: PreparedDocumentInput | null;
    canonicalUrl?: string | null;
    uploadFileHash?: string | null;
    uploadFileId?: string | null;
    savedAt?: Date;
    publishedAt?: Date | null;
    state?: ArticleSavingRequestStatus | null;
    rssFeedUrl?: string | null;
    folder?: string | null;
    feedContent?: string | null;
    dir?: string | null;
    labelNames?: string[];
    highlightAnnotations?: string[];
  }): DeepPartial<LibraryItem> & { originalUrl: string } {
    logger.log('save_page', { url, state, itemId });
    return {
      id: itemId || undefined,
      slug,
      user: { id: userId },
      originalContent: originalHtml,
      readableContent: parsedContent?.content || '',
      description: parsedContent?.excerpt,
      previewContent: parsedContent?.excerpt,
      title:
        title ||
        parsedContent?.title ||
        preparedDocument?.pageInfo.title ||
        croppedPathname ||
        parsedContent?.siteName ||
        url,
      author: preparedDocument?.pageInfo.author || parsedContent?.byline,
      originalUrl: cleanUrl(canonicalUrl || url),
      itemType,
      textContentHash:
        uploadFileHash || stringToHash(parsedContent?.content || url),
      thumbnail:
        (preparedDocument?.pageInfo.previewImage ||
          parsedContent?.previewImage) ??
        undefined,
      publishedAt: validatedDate(
        publishedAt || parsedContent?.publishedDate || undefined
      ),
      uploadFileId: uploadFileId || undefined,
      readingProgressTopPercent: 0,
      readingProgressHighestReadAnchor: 0,
      state: state
        ? (state as unknown as LibraryItemState)
        : LibraryItemState.Succeeded,
      savedAt: validatedDate(savedAt) || new Date(),
      siteName: parsedContent?.siteName,
      itemLanguage: parsedContent?.language,
      siteIcon: parsedContent?.siteIcon,
      wordCount: parsedContent?.textContent
        ? wordsCount(parsedContent.textContent)
        : wordsCount(parsedContent?.content || '', true),
      contentReader: contentReaderForLibraryItem(itemType, uploadFileId),
      subscription: rssFeedUrl,
      folder: folder || 'inbox',
      archivedAt:
        state === ArticleSavingRequestStatus.Archived ? new Date() : null,
      deletedAt:
        state === ArticleSavingRequestStatus.Deleted ? new Date() : null,
      feedContent,
      directionality:
        dir?.toLowerCase() === 'rtl'
          ? DirectionalityType.RTL
          : DirectionalityType.LTR, // 默认为 LTR
      labelNames,
      highlightAnnotations,
    };
  }
}
