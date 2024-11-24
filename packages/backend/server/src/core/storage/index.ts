import './config';

import { Module } from '@nestjs/common';

import {
  AvatarStorage,
  OriginalContentStorage,
  WorkspaceBlobStorage,
} from './wrappers';

@Module({
  providers: [WorkspaceBlobStorage, AvatarStorage, OriginalContentStorage],
  exports: [WorkspaceBlobStorage, AvatarStorage, OriginalContentStorage],
})
export class StorageModule {}

export { AvatarStorage, OriginalContentStorage, WorkspaceBlobStorage };
