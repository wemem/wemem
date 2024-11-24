import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { TracedLogger } from '../../fundamentals';
import { FEEDS_QUEUE, REFRESH_FEED_JOB } from './const';
import { RefreshFeedService } from './service/refresh-feed';

@Processor(FEEDS_QUEUE)
export class FeedsJobConsumer extends WorkerHost {
  private readonly logger = new TracedLogger(FeedsJobConsumer.name);

  constructor(private readonly refreshFeedService: RefreshFeedService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(
      `Processing refresh feed job ${job.id} ${job.name} with data ${JSON.stringify(job.data)}`
    );

    switch (job.name) {
      case REFRESH_FEED_JOB:
        await this.refreshFeedService.handle(job.data);
        break;
    }
  }
}
