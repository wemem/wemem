import type { MainEventRegister } from '../type';
import {
  onActiveTabChanged,
  onTabAction,
  onTabShellViewActiveChange,
  onTabsStatusChange,
  onTabViewsMetaChanged,
} from '../windows-manager';
import { uiSubjects } from './subject';

/**
 * Events triggered by application menu
 */
export const uiEvents = {
  onMaximized: (fn: (maximized: boolean) => void) => {
    const sub = uiSubjects.onMaximized$.subscribe(fn);
    return () => {
      sub.unsubscribe();
    };
  },
  onFullScreen: (fn: (fullScreen: boolean) => void) => {
    const sub = uiSubjects.onFullScreen$.subscribe(fn);
    return () => {
      sub.unsubscribe();
    };
  },
  onTabViewsMetaChanged,
  onTabAction,
  onToggleRightSidebar: (fn: (tabId: string) => void) => {
    const sub = uiSubjects.onToggleRightSidebar$.subscribe(fn);
    return () => {
      sub.unsubscribe();
    };
  },
  onTabsStatusChange,
  onActiveTabChanged,
  onTabShellViewActiveChange,
} satisfies Record<string, MainEventRegister>;
