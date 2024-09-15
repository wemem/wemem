import { Button, Input, Modal } from '@affine/component';
import { useI18n } from '@affine/i18n';
import type { KeyboardEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import * as styles from './create-feed.css';

export interface EditFeedModalProps {
  title?: string;
  onConfirmText?: string;
  init: string;
  onConfirm: (title: string) => void;
  open: boolean;
  showTips?: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditFeedModal = ({
  init,
  onConfirm,
  open,
  showTips,
  onOpenChange,
  title,
}: EditFeedModalProps) => {
  const t = useI18n();
  const onConfirmTitle = useCallback(
    (title: string) => {
      onConfirm(title);
      onOpenChange(false);
    },
    [onConfirm, onOpenChange]
  );
  const onCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Modal open={open} title={title} onOpenChange={onOpenChange} width={480}>
      {init != null ? (
        <EditFeed
          showTips={showTips}
          onConfirmText={t['com.affine.editCollection.save']()}
          init={init}
          onConfirm={onConfirmTitle}
          onCancel={onCancel}
        />
      ) : null}
    </Modal>
  );
};

export interface CreateFeedProps {
  onConfirmText?: string;
  init: string;
  showTips?: boolean;
  onCancel: () => void;
  onConfirm: (title: string) => void;
}

export const EditFeed = ({
  onConfirmText,
  init,
  showTips,
  onCancel,
  onConfirm,
}: CreateFeedProps) => {
  const t = useI18n();
  const [value, onChange] = useState(init);
  const isNameEmpty = useMemo(() => value.trim().length === 0, [value]);
  const save = useCallback(() => {
    if (isNameEmpty) {
      return;
    }
    onConfirm(value);
  }, [onConfirm, value, isNameEmpty]);
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
        <div className={styles.label}>
          {t['ai.wemem.edit-subscription.name']()}
        </div>
        <Input
          autoFocus
          value={value}
          data-testid="input-collection-title"
          placeholder={t['ai.wemem.edit-subscription.placeholder']()}
          onChange={useCallback((value: string) => onChange(value), [onChange])}
          onEnter={save}
          onKeyDown={onKeyDown}
        ></Input>
        {showTips ? (
          <div className={styles.createTips}>
            {t[`ai.wemem.edit-subscription.editTips`]()}
          </div>
        ) : null}
      </div>
      <div className={styles.footer}>
        <Button size="large" onClick={onCancel}>
          {t['ai.wemem.edit-subscription.button.cancel']()}
        </Button>
        <Button
          size="large"
          data-testid="save-collection"
          type="primary"
          disabled={isNameEmpty}
          onClick={save}
        >
          {onConfirmText ?? t['ai.wemem.edit-subscription.button.create']()}
        </Button>
      </div>
    </div>
  );
};
