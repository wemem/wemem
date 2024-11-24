import { Injectable } from '@nestjs/common';

import {
  type BlobInputType,
  Config,
  type StorageProvider,
  StorageProviderFactory,
} from '../../../fundamentals';

@Injectable()
export class PageContentStorage {
  public readonly provider: StorageProvider;

  constructor(
    private readonly config: Config,
    private readonly storageFactory: StorageProviderFactory
  ) {
    this.provider = this.storageFactory.create(
      this.config.storages.pageContent
    );
  }

  async put(key: string, blob: BlobInputType) {
    await this.provider.put(key, blob);
  }

  async get(key: string) {
    return this.provider.get(key);
  }
}
