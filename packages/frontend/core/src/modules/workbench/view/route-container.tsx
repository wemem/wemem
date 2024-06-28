import { IconButton, observeResize } from '@affine/component';
import { WindowsAppControls } from '@affine/core/components/pure/header/windows-app-controls';
import { RightSidebarIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useAtomValue } from 'jotai';
import { Suspense, useCallback, useEffect, useRef } from 'react';

import { AffineErrorBoundary } from '../../../components/affine/affine-error-boundary';
import { appSidebarOpenAtom } from '../../../components/app-sidebar/index.jotai';
import { SidebarSwitch } from '../../../components/app-sidebar/sidebar-header/sidebar-switch';
import { RightSidebarService } from '../../right-sidebar';
import { ViewService } from '../services/view';
import * as styles from './route-container.css';
import { useViewPosition } from './use-view-position';

export interface Props {
  route: {
    Component: React.ComponentType;
  };
}

const ToggleButton = ({
  onToggle,
  className,
  show,
}: {
  onToggle?: () => void;
  className: string;
  show: boolean;
}) => {
  return (
    <IconButton
      size="large"
      onClick={onToggle}
      className={className}
      data-show={show}
    >
      <RightSidebarIcon />
    </IconButton>
  );
};

export const RouteContainer = ({ route }: Props) => {
  const viewHeaderContainerRef = useRef<HTMLDivElement | null>(null);
  const view = useService(ViewService).view;
  const viewPosition = useViewPosition();
  const leftSidebarOpen = useAtomValue(appSidebarOpenAtom);
  const rightSidebar = useService(RightSidebarService).rightSidebar;
  const rightSidebarOpen = useLiveData(rightSidebar.isOpen$);
  const rightSidebarHasViews = useLiveData(rightSidebar.hasViews$);
  const handleToggleRightSidebar = useCallback(() => {
    rightSidebar.toggle();
  }, [rightSidebar]);
  const isWindowsDesktop = environment.isDesktop && environment.isWindows;

  useEffect(() => {
    const container = viewHeaderContainerRef.current;
    if (!container) return;
    return observeResize(container, entry => {
      view.headerContentWidth$.next(entry.contentRect.width);
    });
  }, [view.headerContentWidth$]);
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {viewPosition.isFirst && (
          <SidebarSwitch
            show={!leftSidebarOpen}
            className={styles.leftSidebarButton}
          />
        )}
        <view.header.Target
          ref={viewHeaderContainerRef}
          className={styles.viewHeaderContainer}
        />
        {viewPosition.isLast && (
          <>
            {rightSidebarHasViews && (
              <ToggleButton
                show={!rightSidebarOpen}
                className={styles.rightSidebarButton}
                onToggle={handleToggleRightSidebar}
              />
            )}
            {isWindowsDesktop &&
              !(rightSidebarOpen && rightSidebarHasViews) && (
                <div className={styles.windowsAppControlsContainer}>
                  <WindowsAppControls />
                </div>
              )}
          </>
        )}
      </div>
      <AffineErrorBoundary>
        <Suspense>
          <route.Component />
        </Suspense>
      </AffineErrorBoundary>
      <view.body.Target className={styles.viewBodyContainer} />
    </div>
  );
};
