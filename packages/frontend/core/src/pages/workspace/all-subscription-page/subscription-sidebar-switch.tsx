import { IconButton, Tooltip } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { SidebarIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import * as styles from './subscription-sidebar-switch.css';

const SUBSCRIPTION_SIDEBAR_OPEN = 'subscriptionSidebarOpen';

export const subscriptionSidebarOpen = atomWithStorage(
  SUBSCRIPTION_SIDEBAR_OPEN,
  true
);

export const SubscriptionSidebarSwitch = ({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) => {
  const [open, setOpen] = useAtom(subscriptionSidebarOpen);
  const t = useI18n();
  const tooltipContent = open
    ? t['ai.readease.subscription.sidebar-switch.collapse']()
    : t['ai.readease.subscription.sidebar-switch.expand']();
  const collapseKeyboardShortcuts =
    environment.isBrowser && environment.isMacOs ? ' ⌘+/' : ' Ctrl+/';

  return (
    <Tooltip
      content={tooltipContent + ' ' + collapseKeyboardShortcuts}
      side={open ? 'bottom' : 'right'}
    >
      <IconButton
        className={clsx(styles.sidebarSwitch, className)}
        data-show={show}
        size="24"
        data-testid={`app-sidebar-arrow-button-${open ? 'collapse' : 'expand'}`}
        style={{
          zIndex: 1,
        }}
        onClick={() => setOpen(open => !open)}
      >
        <SidebarIcon />
      </IconButton>
    </Tooltip>
  );
};
