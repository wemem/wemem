-- CreateEnum
CREATE TYPE "UserFeedStatus" AS ENUM ('ACTIVE', 'DELETED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('NEWSLETTER', 'RSS');

-- CreateEnum
CREATE TYPE "FeedFetchContentType" AS ENUM ('ALWAYS', 'NEVER', 'WHEN_EMPTY');

-- CreateEnum
CREATE TYPE "FeedPageType" AS ENUM ('ARTICLE', 'BOOK', 'FILE', 'HIGHLIGHTS', 'IMAGE', 'PROFILE', 'TWEET', 'UNKNOWN', 'VIDEO', 'WEBSITE');

-- CreateEnum
CREATE TYPE "FeedPageState" AS ENUM ('FAILED', 'PROCESSING', 'SUCCEEDED', 'DELETED', 'ARCHIVED', 'CONTENT_NOT_FETCHED');

-- CreateEnum
CREATE TYPE "DirectionalityType" AS ENUM ('LTR', 'RTL');

-- CreateTable
CREATE TABLE "wemem_feeds" (
    "id" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wemem_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wemem_user_feeds" (
    "id" VARCHAR NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "status" "UserFeedStatus" NOT NULL DEFAULT 'ACTIVE',
    "newsletter_email_id" VARCHAR,
    "description" TEXT,
    "url" TEXT,
    "icon" TEXT,
    "type" "FeedType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "most_recent_item_date" TIMESTAMPTZ(3),
    "last_fetched_checksum" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "scheduled_at" TIMESTAMPTZ(3),
    "refreshed_at" TIMESTAMPTZ(3),
    "failed_at" TIMESTAMPTZ(3),
    "is_private" BOOLEAN,
    "workspace_id" VARCHAR NOT NULL,
    "fetchContentType" "FeedFetchContentType" NOT NULL DEFAULT 'ALWAYS',

    CONSTRAINT "wemem_user_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wemem_user_feed_pages" (
    "id" VARCHAR NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "workspace_id" VARCHAR NOT NULL,
    "state" "FeedPageState" NOT NULL DEFAULT 'SUCCEEDED',
    "originalUrl" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "savedAt" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),
    "readAt" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "itemLanguage" TEXT,
    "wordCount" INTEGER,
    "thumbnail" TEXT,
    "type" "FeedPageType" NOT NULL DEFAULT 'UNKNOWN',
    "uploadFileId" UUID,
    "contentChecksum" TEXT NOT NULL,
    "feedUrl" TEXT,
    "directionality" "DirectionalityType" NOT NULL DEFAULT 'LTR',

    CONSTRAINT "wemem_user_feed_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wemem_feed_page_contents" (
    "id" TEXT NOT NULL,
    "original_url" TEXT,
    "aiSummary" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wemem_feed_page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wemem_feeds_name_url_key" ON "wemem_feeds"("name", "url");

-- CreateIndex
CREATE UNIQUE INDEX "wemem_user_feeds_newsletter_email_id_key" ON "wemem_user_feeds"("newsletter_email_id");

-- CreateIndex
CREATE UNIQUE INDEX "wemem_user_feeds_user_id_workspace_id_url_key" ON "wemem_user_feeds"("user_id", "workspace_id", "url");

-- AddForeignKey
ALTER TABLE "wemem_user_feeds" ADD CONSTRAINT "wemem_user_feeds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wemem_user_feed_pages" ADD CONSTRAINT "wemem_user_feed_pages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wemem_user_feed_pages" ADD CONSTRAINT "wemem_user_feed_pages_contentChecksum_fkey" FOREIGN KEY ("contentChecksum") REFERENCES "wemem_feed_page_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
