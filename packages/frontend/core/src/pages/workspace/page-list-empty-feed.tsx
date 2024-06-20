import { Empty } from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { ReactNode } from 'react';

import * as styles from './page-list-empty.css';

// eslint-disable-next-line sonarjs/no-identical-functions
export const EmptyFeedList = ({ heading }: { heading: ReactNode }) => {
  const t = useAFFiNEI18N();
  return (
    <div className={styles.pageListEmptyStyle}>
      {heading && <div>{heading}</div>}
      <Empty title={t['com.affine.emptyDesc.feed']()} />
    </div>
  );
};


// eslint-disable-next-line sonarjs/no-identical-functions
export const EmptyFeedDocsList = ({ heading }: { heading: ReactNode }) => {
  const t = useAFFiNEI18N();
  return (
    <div className={styles.pageListEmptyStyle}>
      {heading && <div>{heading}</div>}
      <Empty title={t['com.affine.emptyDesc.feedDocs']()}
             description={t['com.affine.emptyDesc.feedDocsDescription']()} />
    </div>
  );
};


