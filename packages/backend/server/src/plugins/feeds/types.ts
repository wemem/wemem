import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  FeedFetchContentType,
  FeedPageType,
  FeedType,
  UserFeedStatus,
} from '@prisma/client';

@InputType()
export class SubscribeFeedInput {
  @Field(() => ID)
  feedId!: string;

  @Field(() => Boolean, { nullable: true })
  isPrivate?: boolean | null;

  @Field(() => String)
  workspaceId!: string;

  @Field(() => FeedType)
  type!: FeedType;
}

@ObjectType()
export class FeedPage {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  aiSummary?: string | null;

  @Field(() => String, { nullable: true })
  author?: string | null;

  @Field(() => String)
  content!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  language?: string | null;

  @Field(() => FeedPageType)
  type!: FeedPageType;

  @Field(() => String)
  originalUrl!: string;

  @Field(() => String, { nullable: true })
  feedUrl?: string | null;
}

@ObjectType()
export class FeedPageEdge {
  @Field()
  cursor!: string;

  @Field(() => FeedPage)
  node!: FeedPage;
}

@ObjectType()
export class PageInfo {
  @Field(() => String, { nullable: true })
  endCursor?: string | null;

  @Field(() => Boolean)
  hasNextPage!: boolean;

  @Field(() => Boolean)
  hasPreviousPage!: boolean;

  @Field(() => String, { nullable: true })
  startCursor?: string | null;

  @Field(() => Int, { nullable: true })
  totalCount?: number | null;
}

@ObjectType()
export class PullFeedPagesOutput {
  @Field(() => [FeedPageEdge])
  edges!: FeedPageEdge[];

  @Field(() => PageInfo)
  pageInfo!: PageInfo;
}

@ObjectType()
export class UserFeed {
  @Field(() => ID)
  id!: string;

  @Field()
  userId!: string;

  @Field()
  name!: string;

  @Field(() => UserFeedStatus)
  status!: UserFeedStatus;

  @Field(() => String, { nullable: true })
  newsletterEmailId?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  url?: string | null;

  @Field(() => String, { nullable: true })
  icon?: string | null;

  @Field(() => FeedType)
  type!: FeedType;

  @Field(() => Int)
  count!: number;

  @Field(() => Date, { nullable: true })
  mostRecentItemDate?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => Boolean, { nullable: true })
  isPrivate?: boolean | null;

  @Field(() => FeedFetchContentType)
  fetchContentType!: FeedFetchContentType;

  @Field(() => String, { nullable: true })
  workspaceId?: string | null;
}

@ObjectType()
export class Feed {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String)
  url!: string;

  @Field(() => String, { nullable: true })
  icon?: string | null;

  @Field(() => Date)
  createdAt!: Date;
}

registerEnumType(FeedType, {
  name: 'FeedType',
  description: 'The type of feed source',
});

registerEnumType(UserFeedStatus, {
  name: 'UserFeedStatus',
  description: 'The status of feed source',
});

registerEnumType(FeedFetchContentType, {
  name: 'FeedFetchContentType',
  description: 'The type of fetch content',
});

registerEnumType(FeedPageType, {
  name: 'FeedPageType',
  description: 'The type of feed page',
});
