import type { MenuItemProps } from '@affine/component';
import { Menu, MenuIcon, MenuItem } from '@affine/component';
import { type Tag, TagService } from '@affine/core/modules/tag';
import { isInternalTag } from '@affine/core/modules/tag/entities/internal-tag';
import { useI18n } from '@affine/i18n';
import { DeleteIcon, EditIcon, PlusIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import type { PropsWithChildren, ReactElement } from 'react';
import { useMemo } from 'react';

import * as styles from './tag-operations.css';

export const TagOperations = ({
  tag,
  openRenameModal,
  onAddDocToTag,
  children,
}: PropsWithChildren<{
  tag: Tag;
  openRenameModal: () => void;
  onAddDocToTag?: () => void;
}>) => {
  const tagService = useService(TagService);
  const t = useI18n();
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
      ...(!isInternalTag(tag.value$.getValue())
        ? [
            {
              icon: (
                <MenuIcon>
                  <EditIcon />
                </MenuIcon>
              ),
              name: t['Rename'](),
              click: openRenameModal,
            },
          ]
        : []),
      ...(onAddDocToTag
        ? [
            {
              icon: (
                <MenuIcon>
                  <PlusIcon />
                </MenuIcon>
              ),
              name: t['New Page'](),
              click: onAddDocToTag,
            },
          ]
        : []),
      ...(!isInternalTag(tag.value$.getValue())
        ? [
            {
              element: <div key="divider" className={styles.divider}></div>,
            },
          ]
        : []),
      ...(!isInternalTag(tag.value$.getValue())
        ? [
            {
              icon: (
                <MenuIcon>
                  <DeleteIcon />
                </MenuIcon>
              ),
              name: t['Delete'](),
              click: () => {
                tagService.tagList.deleteTag(tag.id);
              },
              type: 'danger' as MenuItemProps['type'],
            },
          ]
        : []),
    ],
    [tag.value$, tag.id, t, openRenameModal, onAddDocToTag, tagService.tagList]
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
                data-testid="tag-option"
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
