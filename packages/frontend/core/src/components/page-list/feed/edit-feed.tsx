import { Button, Input, Modal } from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
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
  const t = useAFFiNEI18N();
  const onConfirmTitle = useCallback(
    (title: string) => {
      onConfirm(title);
      onOpenChange(false);
    },
    [onConfirm, onOpenChange],
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
  const t = useAFFiNEI18N();
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
    [isNameEmpty],
  );
  return (
    <div>
      <div className={styles.content}>
        <div className={styles.label}>
          {t['ai.readflow.editFeed.name']()}
        </div>
        <Input
          autoFocus
          value={value}
          data-testid="input-collection-title"
          placeholder={t['ai.readflow.editFeed.placeholder']()}
          onChange={useCallback((value: string) => onChange(value), [onChange])}
          onEnter={save}
          onKeyDown={onKeyDown}
        ></Input>
        {showTips ? (
          <div className={styles.createTips}>
            {t[`ai.readflow.editFeed.editTips`]()}
          </div>
        ) : null}
      </div>
      <div className={styles.footer}>
        <Button size="large" onClick={onCancel}>
          {t['ai.readflow.editFeed.button.cancel']()}
        </Button>
        <Button
          size="large"
          data-testid="save-collection"
          type="primary"
          disabled={isNameEmpty}
          onClick={save}
        >
          {onConfirmText ?? t['ai.readflow.editFeed.button.create']()}
        </Button>
      </div>
    </div>
  );
};
