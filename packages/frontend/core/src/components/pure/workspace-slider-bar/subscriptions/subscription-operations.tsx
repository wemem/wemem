import type { MenuItemProps } from '@affine/component';
import { Menu, MenuIcon, MenuItem } from '@affine/component';
import {
  type CollectionMeta,
  useUnsubscribe,
} from '@affine/core/components/page-list';
import { useI18n } from '@affine/i18n';
import { DeleteIcon, EditIcon } from '@blocksuite/icons/rc';
import type { PropsWithChildren, ReactElement } from 'react';
import { useMemo } from 'react';

import * as styles from './subscription-operations.css';

export const SubscriptionOperations = ({
  subscriptionMeta,
  openRenameModal,
  children,
}: PropsWithChildren<{
  subscriptionMeta: CollectionMeta;
  openRenameModal: () => void;
  onAddDocToTag?: () => void;
}>) => {
  const t = useI18n();
  const unsubscribe = useUnsubscribe();
  const actions = useMemo<
    Array<
      | {
          icon: ReactElement;
          name: string;
          click: () => void;
          type?: MenuItemProps['type'];
          element?: undefined;
        }
      | {
          element: ReactElement;
        }
    >
  >(
    () => [
      {
        icon: (
          <MenuIcon>
            <EditIcon />
          </MenuIcon>
        ),
        name: t['Rename'](),
        click: openRenameModal,
      },
      {
        element: <div key="divider" className={styles.divider}></div>,
      },
      {
        icon: (
          <MenuIcon>
            <DeleteIcon />
          </MenuIcon>
        ),
        name: t['ai.wemem.subscriptions.unsubscribe'](),
        click: () => {
          unsubscribe(subscriptionMeta.id);
        },
        type: 'danger' as MenuItemProps['type'],
      },
    ],
    [t, openRenameModal, unsubscribe, subscriptionMeta.id]
  );
  return (
    <Menu
      items={
        <div style={{ minWidth: 150 }}>
          {actions.map(action => {
            if (action.element) {
              return action.element;
            }
            return (
              <MenuItem
                data-testid="subscription-option"
                key={action.name}
                type={action.type}
                preFix={action.icon}
                onClick={action.click}
              >
                {action.name}
              </MenuItem>
            );
          })}
        </div>
      }
    >
      {children}
    </Menu>
  );
};
