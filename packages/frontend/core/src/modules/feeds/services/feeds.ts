import type { WorkspaceService } from '@toeverything/infra';
import { LiveData, Service } from '@toeverything/infra';
import { Observable } from 'rxjs';

import { FeedInfoModal } from '../entities/feed-info-modal';
import { FeedSearchModal } from '../entities/feed-search-modal';
import { FeedTree } from '../entities/feed-tree';
import type { Feed } from '../stores/feed-node';

const SETTING_KEY = 'feedsSetting';

const CURSOR_KEY = 'cursor';

export class FeedsService extends Service {
  public readonly feedTree = this.framework.createEntity(FeedTree);
  public readonly searchModal = this.framework.createEntity(FeedSearchModal);
  public readonly infoModal = this.framework.createEntity(FeedInfoModal);

  constructor(private readonly workspaceService: WorkspaceService) {
    super();
  }

  private get setting() {
    return this.workspaceService.workspace.docCollection.doc.getMap(
      SETTING_KEY
    );
  }

  public get cursor(): string | undefined {
    return this.setting.get(CURSOR_KEY) as string;
  }

  readonly cursor$ = LiveData.from(
    new Observable<string>(subscriber => {
      subscriber.next(this.cursor || '0');
      const fn = () => {
        subscriber.next(this.cursor || '0');
      };
      this.setting.observeDeep(fn);
      return () => {
        this.setting.unobserveDeep(fn);
      };
    }),
    '0'
  );

  public updateCursor(cursor: string) {
    this.setting.set(CURSOR_KEY, cursor);
  }

  feedById$(feedId: string) {
    return LiveData.from<Feed | null>(
      this.feedTree.rootFolder.nodesStore.watchNodeInfo(feedId),
      null
    );
  }
}
