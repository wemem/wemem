import { Service } from '@toeverything/infra';

import { SubscribeFeed } from '../entities/subscribe-feed';

export class NewSubscriptionService extends Service {
  public readonly subscribeFeed = this.framework.createEntity(SubscribeFeed);
}
