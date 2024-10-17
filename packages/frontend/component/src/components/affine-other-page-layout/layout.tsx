import { Button } from '@affine/component/ui/button';
import { useI18n } from '@affine/i18n';
import { type ReactNode, useCallback } from 'react';

import { Logo1IconBorder } from '../../wemem/icons';
import { DesktopNavbar } from './desktop-navbar';
import * as styles from './index.css';
import { MobileNavbar } from './mobile-navbar';

export const AffineOtherPageLayout = ({
  children,
}: {
  children: ReactNode;
}) => {
  const t = useI18n();

  const openDownloadLink = useCallback(() => {
    open(BUILD_CONFIG.downloadUrl, '_blank');
  }, []);

  return (
    <div className={styles.root}>
      {BUILD_CONFIG.isElectron ? (
        <div className={styles.draggableHeader} />
      ) : (
        <div className={styles.topNav}>
          <a href="/" rel="noreferrer" className={styles.affineLogo}>
            <Logo1IconBorder width={24} height={24} />
          </a>

          <DesktopNavbar />
          <Button
            onClick={openDownloadLink}
            className={styles.hideInSmallScreen}
          >
            {t['com.affine.auth.open.affine.download-app']()}
          </Button>
          <MobileNavbar />
        </div>
      )}

      {children}
    </div>
  );
};
