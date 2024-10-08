import { Service } from '@toeverything/infra';

import { SubscribeFeed } from '../entities/subscribe-feed';

export class NewFeedService extends Service {
  public readonly subscribeFeed = this.framework.createEntity(SubscribeFeed);
}
