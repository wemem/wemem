import { IconButton } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { ArrowLeftSmallIcon, ArrowRightSmallIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo } from 'react';

import { useGeneralShortcuts } from '../../../hooks/affine/use-shortcuts';
import { NavigatorService } from '../services/navigator';
import * as styles from './navigation-buttons.css';

const tooltipSideBottom = { side: 'bottom' as const };

export const NavigationButtons = () => {
  const t = useI18n();

  const shortcuts = useGeneralShortcuts().shortcuts;

  const shortcutsObject = useMemo(() => {
    const goBack = t['com.affine.keyboardShortcuts.goBack']();
    const goBackShortcut = shortcuts?.[goBack];

    const goForward = t['com.affine.keyboardShortcuts.goForward']();
    const goForwardShortcut = shortcuts?.[goForward];
    return {
      goBack,
      goBackShortcut,
      goForward,
      goForwardShortcut,
    };
  }, [shortcuts, t]);

  const navigator = useService(NavigatorService).navigator;

  const backable = useLiveData(navigator.backable$);
  const forwardable = useLiveData(navigator.forwardable$);

  const handleBack = useCallback(() => {
    navigator.back();
  }, [navigator]);

  const handleForward = useCallback(() => {
    navigator.forward();
  }, [navigator]);

  useEffect(() => {
    const cb = (event: MouseEvent) => {
      if (event.button === 3 || event.button === 4) {
        event.preventDefault();
        event.stopPropagation();

        if (event.button === 3) {
          navigator.back();
        } else {
          navigator.forward();
        }
      }
    };
    document.addEventListener('mouseup', cb);
    return () => {
      document.removeEventListener('mouseup', cb);
    };
  }, [navigator]);

  if (!environment.isDesktop) {
    return null;
  }

  // TODO(@CatsJuice): tooltip with shortcut
  return (
    <div className={styles.container}>
      <IconButton
        tooltip={`${shortcutsObject.goBack} ${shortcutsObject.goBackShortcut}`}
        tooltipOptions={tooltipSideBottom}
        className={styles.button}
        data-testid="app-navigation-button-back"
        disabled={!backable}
        onClick={handleBack}
        size={24}
      >
        <ArrowLeftSmallIcon />
      </IconButton>
      <IconButton
        tooltip={`${shortcutsObject.goForward} ${shortcutsObject.goForwardShortcut}`}
        tooltipOptions={tooltipSideBottom}
        className={styles.button}
        data-testid="app-navigation-button-forward"
        disabled={!forwardable}
        onClick={handleForward}
        size={24}
      >
        <ArrowRightSmallIcon />
      </IconButton>
    </div>
  );
};
