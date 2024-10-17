import { Entity, LiveData } from '@toeverything/infra';
import { finalize, of, switchMap } from 'rxjs';

import type { AuthService } from '../../cloud';
import type { UserspaceService } from '../services/userspace';

export class CurrentUserDB extends Entity {
  constructor(
    private readonly userDBService: UserspaceService,
    private readonly authService: AuthService
  ) {
    super();
  }

  db$ = LiveData.from(
    this.authService.session.account$
      .selector(a => a?.id)
      .pipe(
        switchMap(userId => {
          if (userId) {
            const ref = this.userDBService.openDB(userId);
            return of(ref.obj).pipe(
              finalize(() => {
                ref.release();
              })
            );
          } else {
            return of(null);
          }
        })
      ),
    null
  );
}
