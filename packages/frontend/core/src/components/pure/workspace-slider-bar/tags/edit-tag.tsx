import { Button, Input, toast } from '@affine/component';
import { Menu } from '@affine/component/ui/menu';
import { tagColors } from '@affine/core/components/affine/page-properties/common';
import type { TagMeta } from '@affine/core/components/page-list';
import {
  randomTagColor,
  TagIcon,
} from '@affine/core/components/page-list/tags/create-tag';
import { type Tag, TagService } from '@affine/core/modules/tag';
import { useTagI18N } from '@affine/core/modules/tag/entities/internal-tag';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import type { KeyboardEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import * as styles from './edit-tag.css';

export const EditTagModal = ({
  open,
  onOpenChange,
  tag,
  tagMeta,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (newName: string) => void;
  tag: Tag;
  tagMeta: TagMeta;
}) => {
  const tagList = useService(TagService).tagList;
  const tagOptions = useLiveData(tagList.tagMetas$);
  const t = useI18n();
  const tt = useTagI18N();
  const [menuOpen, setMenuOpen] = useState(false);
  const [title, setTitle] = useState(tagMeta.title);
  const [tagIcon, setTagIcon] = useState(tagMeta.color || randomTagColor());
  const handleChangeIcon = useCallback((value: string) => {
    setTagIcon(value);
  }, []);

  const tags = useMemo(() => {
    return tagColors.map(([_, color]) => {
      return {
        name: name,
        color: color,
        onClick: () => {
          handleChangeIcon(color);
          setMenuOpen(false);
        },
      };
    });
  }, [handleChangeIcon]);

  const items = useMemo(() => {
    const tagItems = tags.map(item => {
      return (
        <div
          key={item.color}
          onClick={item.onClick}
          className={clsx(styles.tagItem, {
            ['active']: item.color === tagIcon,
          })}
        >
          <TagIcon color={item.color} large={true} />
        </div>
      );
    });
    return <div className={styles.tagItemsWrapper}>{tagItems}</div>;
  }, [tagIcon, tags]);

  const onClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const onConfirm = useCallback(() => {
    if (!title?.trim()) return;

    if (tagMeta.title === title.trim() && tagMeta.color === tagIcon) {
      onClose();
      return;
    }

    if (
      tagOptions.some(
        tag => tag.title === title.trim() && tag.id !== tagMeta?.id
      )
    ) {
      return toast(t['com.affine.tags.create-tag.toast.exist']());
    }

    tag.rename(title.trim());
    tag.changeColor(tagIcon);

    toast(t['com.affine.tags.edit-tag.toast.success']());
    onClose();
    return;
  }, [
    title,
    tagMeta.title,
    tagMeta.color,
    tagMeta?.id,
    tagIcon,
    tagOptions,
    tag,
    t,
    onClose,
  ]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Escape') return;
      if (tagMeta.title !== title) setTitle(title);
      if (tagMeta.color !== tagIcon) setTagIcon(tagIcon);
      onOpenChange(false);
    },
    [tagMeta.title, tagMeta.color, title, tagIcon, onOpenChange]
  );

  return (
    <Menu
      rootOptions={{
        open: open,
        onOpenChange: onOpenChange,
      }}
      contentOptions={{
        side: 'left',
        onPointerDownOutside: onConfirm,
        sideOffset: -12,
      }}
      items={
        <div className={styles.createTagWrapper} data-show={open}>
          <Menu
            rootOptions={{
              open: menuOpen,
              onOpenChange: setMenuOpen,
            }}
            items={items}
          >
            <Button className={styles.menuBtn}>
              <TagIcon color={tagIcon} />
            </Button>
          </Menu>
          <Input
            autoFocus
            value={tt(title)}
            onChange={setTitle}
            onEnter={onConfirm}
            onKeyDown={onKeyDown}
            data-testid="rename-modal-input"
            style={{ width: 220, height: 34 }}
          />
        </div>
      }
    >
      <div></div>
    </Menu>
  );
};
