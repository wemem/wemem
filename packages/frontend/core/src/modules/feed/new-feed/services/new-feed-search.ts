import { Service } from '@toeverything/infra';

import { NewFeed } from '../entities/new-feed';

export class NewFeedService extends Service {
  public readonly newFeed = this.framework.createEntity(NewFeed);
}
