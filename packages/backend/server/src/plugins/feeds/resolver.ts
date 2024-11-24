import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthGuard, CurrentUser } from '../../core/auth';
import { FeedsService } from './service';
import {
  Feed,
  PullFeedPagesOutput,
  SubscribeFeedInput,
  UserFeed,
} from './types';

@Resolver()
@UseGuards(AuthGuard)
export class FeedsResolver {
  constructor(private readonly feedsService: FeedsService) {}

  @Query(() => PullFeedPagesOutput)
  async pullFeedPages(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId', { nullable: true }) workspaceId: string,
    @Args('after', { nullable: true }) after?: string,
    @Args('first', { nullable: true }) first?: number
  ): Promise<PullFeedPagesOutput> {
    return this.feedsService.pullFeedPages({
      after,
      first: Math.min(first || 10, 100),
      workspaceId,
      userId: user.id,
    });
  }

  @Query(() => [Feed])
  async searchFeeds(@Args('keyword') keyword: string): Promise<Feed[]> {
    return this.feedsService.searchFeeds(keyword ? keyword.trim() : '');
  }

  @Mutation(() => UserFeed)
  async subscribeFeed(
    @Args('input') input: SubscribeFeedInput,
    @CurrentUser() user: CurrentUser
  ): Promise<UserFeed> {
    return this.feedsService.subscribeFeed(input, user.id);
  }

  @Mutation(() => String)
  async unsubscribeFeed(
    @Args('userFeedId') userFeedId: string,
    @Args('workspaceId') workspaceId: string,
    @CurrentUser() user: CurrentUser
  ): Promise<string> {
    await this.feedsService.unsubscribeFeed(userFeedId, user.id, workspaceId);
    return 'success';
  }
}
