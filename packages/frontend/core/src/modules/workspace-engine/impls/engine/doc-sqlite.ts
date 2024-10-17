import { apis } from '@affine/electron-api';
import type { ByteKV, ByteKVBehavior, DocStorage } from '@toeverything/infra';
import { AsyncLock } from '@toeverything/infra';

import { BroadcastChannelDocEventBus } from './doc-broadcast-channel';

export class SqliteDocStorage implements DocStorage {
  constructor(private readonly workspaceId: string) {}
  eventBus = new BroadcastChannelDocEventBus(this.workspaceId);
  readonly doc = new Doc(this.workspaceId);
  readonly syncMetadata = new SyncMetadataKV(this.workspaceId);
  readonly serverClock = new ServerClockKV(this.workspaceId);
}

type DocType = DocStorage['doc'];

class Doc implements DocType {
  lock = new AsyncLock();
  constructor(private readonly workspaceId: string) {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
  }

  async transaction<T>(
    cb: (transaction: ByteKVBehavior) => Promise<T>
  ): Promise<T> {
    using _lock = await this.lock.acquire();
    return await cb(this);
  }

  keys(): string[] | Promise<string[]> {
    return [];
  }

  async get(docId: string) {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    const update = await apis.db.getDocAsUpdates(
      'workspace',
      this.workspaceId,
      docId
    );

    if (update) {
      if (
        update.byteLength === 0 ||
        (update.byteLength === 2 && update[0] === 0 && update[1] === 0)
      ) {
        return null;
      }

      return update;
    }

    return null;
  }

  async set(docId: string, data: Uint8Array) {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    await apis.db.applyDocUpdate('workspace', this.workspaceId, data, docId);
  }

  clear(): void | Promise<void> {
    return;
  }

  async del(docId: string) {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    await apis.db.deleteDoc('workspace', this.workspaceId, docId);
  }
}

class SyncMetadataKV implements ByteKV {
  constructor(private readonly workspaceId: string) {}
  transaction<T>(cb: (behavior: ByteKVBehavior) => Promise<T>): Promise<T> {
    return cb(this);
  }

  get(key: string): Uint8Array | null | Promise<Uint8Array | null> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.getSyncMetadata('workspace', this.workspaceId, key);
  }

  set(key: string, data: Uint8Array): void | Promise<void> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.setSyncMetadata('workspace', this.workspaceId, key, data);
  }

  keys(): string[] | Promise<string[]> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.getSyncMetadataKeys('workspace', this.workspaceId);
  }

  del(key: string): void | Promise<void> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.delSyncMetadata('workspace', this.workspaceId, key);
  }

  clear(): void | Promise<void> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.clearSyncMetadata('workspace', this.workspaceId);
  }
}

class ServerClockKV implements ByteKV {
  constructor(private readonly workspaceId: string) {}
  transaction<T>(cb: (behavior: ByteKVBehavior) => Promise<T>): Promise<T> {
    return cb(this);
  }

  get(key: string): Uint8Array | null | Promise<Uint8Array | null> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.getServerClock('workspace', this.workspaceId, key);
  }

  set(key: string, data: Uint8Array): void | Promise<void> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.setServerClock('workspace', this.workspaceId, key, data);
  }

  keys(): string[] | Promise<string[]> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.getServerClockKeys('workspace', this.workspaceId);
  }

  del(key: string): void | Promise<void> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.delServerClock('workspace', this.workspaceId, key);
  }

  clear(): void | Promise<void> {
    if (!apis?.db) {
      throw new Error('sqlite datasource is not available');
    }
    return apis.db.clearServerClock('workspace', this.workspaceId);
  }
}
