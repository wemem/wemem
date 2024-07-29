import { Button, Input, Menu, Modal, toast } from '@affine/component';
import { tagColors } from '@affine/core/components/affine/page-properties/common';
import {
  randomTagColor,
  TagIcon,
} from '@affine/core/components/page-list/tags/create-tag';
import { TagService } from '@affine/core/modules/tag';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import type { KeyboardEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import * as styles from './create-tag.css';

export interface CreateTagModalProps {
  title?: string;
  init: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTagModal = ({
  init,
  open,
  onOpenChange,
  title,
}: CreateTagModalProps) => {
  const onClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Modal open={open} title={title} onOpenChange={onOpenChange} width={480}>
      {init != null ? <CreateTag onClose={onClose} /> : null}
    </Modal>
  );
};

export interface CreateTagProps {
  onClose: () => void;
}

export const CreateTag = ({ onClose }: CreateTagProps) => {
  const tagList = useService(TagService).tagList;
  const tagOptions = useLiveData(tagList.tagMetas$);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useI18n();

  const [tagName, setTagName] = useState('');
  const handleChangeName = useCallback((value: string) => {
    setTagName(value);
  }, []);
  const [tagIcon, setTagIcon] = useState(randomTagColor());

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

  const onConfirm = useCallback(() => {
    if (!tagName?.trim()) return;
    if (tagOptions.some(tag => tag.title === tagName.trim())) {
      return toast(t['com.affine.tags.create-tag.toast.exist']());
    }
    tagList.createTag(tagName.trim(), tagIcon);
    toast(t['com.affine.tags.create-tag.toast.success']());
    onClose();
    return;
  }, [tagName, tagOptions, tagList, tagIcon, t, onClose]);

  const isNameEmpty = useMemo(() => tagName.trim().length === 0, [tagName]);
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        if (isNameEmpty) {
          return;
        } else {
          e.currentTarget.blur();
        }
      }
      e.stopPropagation();
    },
    [isNameEmpty]
  );
  return (
    <div>
      <div className={styles.content}>
        <div className={styles.label}>{t['ai.readease.createTag.name']()}</div>
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
            placeholder={t['ai.readease.createTag.name.placeholder']()}
            inputStyle={{ fontSize: 'var(--affine-font-xs)' }}
            onEnter={onConfirm}
            value={tagName}
            onChange={handleChangeName}
            onKeyDown={onKeyDown}
            autoFocus
          />
        </div>
      </div>
      <div className={styles.footer}>
        <Button size="large" onClick={onClose}>
          {t['Cancel']()}
        </Button>
        <Button
          size="large"
          data-testid="save-tag"
          type="primary"
          disabled={isNameEmpty}
          onClick={onConfirm}
        >
          {t['Save']()}
        </Button>
      </div>
    </div>
  );
};
