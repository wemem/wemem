import { Service } from '@toeverything/infra';

import { SubscribeFeed } from '../entities/subscribe-feed';

export class SubscriptionsService extends Service {
  public readonly subscribeFeed = this.framework.createEntity(SubscribeFeed);
}
