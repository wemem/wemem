import { BrowserWarning, LocalDemoTips } from '@affine/component/affine-banner';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { Trans, useI18n } from '@affine/i18n';
import { useLiveData, useService, type Workspace } from '@toeverything/infra';
import { useSetAtom } from 'jotai';
import { useCallback, useState } from 'react';

import { authAtom } from '../atoms';
import { useEnableCloud } from '../hooks/affine/use-enable-cloud';
import { AuthService } from '../modules/cloud';

const minimumChromeVersion = 106;

const shouldShowWarning = (() => {
  if (environment.isDesktop) {
    // even though desktop has compatibility issues,
    //  we don't want to show the warning
    return false;
  }
  if (!environment.isBrowser) {
    // disable in SSR
    return false;
  }
  if (environment.isChrome) {
    return environment.chromeVersion < minimumChromeVersion;
  } else {
    return !environment.isMobile;
  }
})();

const OSWarningMessage = () => {
  const t = useI18n();
  const notChrome = environment.isBrowser && !environment.isChrome;
  const notGoodVersion =
    environment.isBrowser &&
    environment.isChrome &&
    environment.chromeVersion < minimumChromeVersion;

  if (notChrome) {
    return (
      <span>
        <Trans i18nKey="recommendBrowser">
          We recommend the <strong>Chrome</strong> browser for an optimal
          experience.
        </Trans>
      </span>
    );
  } else if (notGoodVersion) {
    return <span>{t['upgradeBrowser']()}</span>;
  }
  return null;
};

export const TopTip = ({
  pageId,
  workspace,
}: {
  pageId?: string;
  workspace: Workspace;
}) => {
  const loginStatus = useLiveData(useService(AuthService).session.status$);
  const isLoggedIn = loginStatus === 'authenticated';

  const [showWarning, setShowWarning] = useState(shouldShowWarning);
  const [showLocalDemoTips, setShowLocalDemoTips] = useState(true);
  const confirmEnableCloud = useEnableCloud();

  const setAuthModal = useSetAtom(authAtom);
  const onLogin = useCallback(() => {
    setAuthModal({ openModal: true, state: 'signIn' });
  }, [setAuthModal]);

  if (
    showLocalDemoTips &&
    !environment.isDesktop &&
    workspace.flavour === WorkspaceFlavour.LOCAL
  ) {
    return (
      <LocalDemoTips
        isLoggedIn={isLoggedIn}
        onLogin={onLogin}
        onEnableCloud={() =>
          confirmEnableCloud(workspace, { openPageId: pageId })
        }
        onClose={() => {
          setShowLocalDemoTips(false);
        }}
      />
    );
  }

  return (
    <BrowserWarning
      show={showWarning}
      message={<OSWarningMessage />}
      onClose={() => {
        setShowWarning(false);
      }}
    />
  );
};
