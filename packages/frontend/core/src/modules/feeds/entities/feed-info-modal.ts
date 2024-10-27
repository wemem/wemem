import { Entity, LiveData } from '@toeverything/infra';

export class FeedInfoModal extends Entity {
  public readonly feedId$ = new LiveData<string | null>(null);
  public readonly open$ = LiveData.computed(get => !!get(this.feedId$));

  public open(feedId?: string) {
    if (feedId) {
      this.feedId$.next(feedId);
    } else {
      this.feedId$.next(null);
    }
  }

  public close() {
    this.feedId$.next(null);
  }

  public onOpenChange(open: boolean) {
    if (!open) this.feedId$.next(null);
  }
}
