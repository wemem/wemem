-- CreateTable
CREATE TABLE "feeds" (
    "id" VARCHAR NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "link" VARCHAR(500) NOT NULL,
    "feed_link" VARCHAR(500) NOT NULL,
    "links" VARCHAR(500)[],
    "updated" TIMESTAMPTZ(6),
    "published" TIMESTAMPTZ(6),
    "language" VARCHAR(50),
    "image" JSON,
    "copyright" VARCHAR(1000),
    "generator" VARCHAR(100),
    "categories" VARCHAR(100)[],
    "dublin_core_ext" JSON,
    "itunes_ext" JSON,
    "extensions" JSON NOT NULL,
    "custom" JSON NOT NULL,
    "feed_type" VARCHAR(20) NOT NULL,
    "feed_version" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_items" (
    "id" VARCHAR NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "description_markdown" TEXT,
    "content" TEXT,
    "content_markdown" TEXT,
    "link" VARCHAR(500),
    "links" VARCHAR(500)[],
    "updated" TIMESTAMPTZ(6),
    "published" TIMESTAMPTZ(6),
    "guid" VARCHAR(500),
    "image" JSON,
    "categories" VARCHAR(50)[],
    "enclosures" JSON,
    "dublin_core_ext" JSON,
    "itunes_ext" JSON,
    "extensions" JSON,
    "custom" JSON,
    "feed_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_person" (
    "id" VARCHAR NOT NULL,
    "feed_item_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feeds_authors" (
    "feed_id" VARCHAR(40) NOT NULL,
    "person_id" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feeds_authors_pkey" PRIMARY KEY ("feed_id","person_id")
);

-- CreateTable
CREATE TABLE "feed_items_authors" (
    "feed_item_id" VARCHAR(40) NOT NULL,
    "person_id" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_items_authors_pkey" PRIMARY KEY ("feed_item_id","person_id")
);

-- CreateIndex
CREATE INDEX "feeds_feed_link_idx" ON "feeds"("feed_link");

-- CreateIndex
CREATE INDEX "feed_person_feed_item_id_name_email_idx" ON "feed_person"("feed_item_id", "name", "email");

-- CreateIndex
CREATE UNIQUE INDEX "feed_person_feed_item_id_name_email_key" ON "feed_person"("feed_item_id", "name", "email");

-- AddForeignKey
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeds_authors" ADD CONSTRAINT "feeds_authors_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeds_authors" ADD CONSTRAINT "feeds_authors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "feed_person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_items_authors" ADD CONSTRAINT "feed_items_authors_feed_item_id_fkey" FOREIGN KEY ("feed_item_id") REFERENCES "feed_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_items_authors" ADD CONSTRAINT "feed_items_authors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "feed_person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
