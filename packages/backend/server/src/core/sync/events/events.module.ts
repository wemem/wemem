import { Module } from '@nestjs/common';

import { DocModule } from '../../doc';
import { PermissionService } from '../../workspaces/permission';
import { EventsGateway } from './events.gateway';
import { SyncController } from './sync.controller';

@Module({
  imports: [DocModule],
  providers: [EventsGateway, PermissionService],
  controllers: [SyncController],
})
export class EventsModule {}
