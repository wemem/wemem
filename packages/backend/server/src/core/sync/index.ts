import { Module } from '@nestjs/common';

import { DocStorageModule } from '../doc';
import { PermissionModule } from '../permission';
import { SpaceSyncGateway } from './gateway';
import { SyncController } from './sync.controller';

@Module({
  imports: [DocStorageModule, PermissionModule],
  providers: [SpaceSyncGateway],
  controllers: [SyncController],
})
export class SyncModule {}
