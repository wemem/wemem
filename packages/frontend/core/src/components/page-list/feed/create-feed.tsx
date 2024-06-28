import { Button, Input, Modal, RadioButton, RadioButtonGroup } from '@affine/component';
import { useI18n } from '@affine/i18n';
import type { KeyboardEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import * as styles from './create-feed.css';
import { feedTypeWrapper } from './create-feed.css';

enum FeedType {
  WeChat = 'WeChat',
  RSS = 'RSS',
}

export interface CreateFeedModalProps {
  title?: string;
  onConfirmText?: string;
  init: string;
  onConfirm: (title: string) => void;
  open: boolean;
  showTips?: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateFeedModal = ({
                                  init,
                                  onConfirm,
                                  open,
                                  showTips,
                                  onOpenChange,
                                  title,
                                }: CreateFeedModalProps) => {
  const t = useI18n();
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
        <CreateFeed
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

export const CreateFeed = ({
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
    [isNameEmpty],
  );
  const [feedType, setFeedType] = useState(FeedType.WeChat);
  return (
    <div>
      <div className={styles.content}>
        <RadioButtonGroup
          width={250}
          className={feedTypeWrapper}
          value={feedType}
          onValueChange={useCallback(
            (value: FeedType) => {
              setFeedType(value);
            },
            [setFeedType],
          )}
        >
          <RadioButton value={FeedType.WeChat} data-testid="feed-type-wechat-trigger">
            {t['ai.readflow.editFeed.feedType.wechat']()}
          </RadioButton>
          <RadioButton value={FeedType.RSS} data-testid="feed-type-rss-trigger">
            {t['ai.readflow.editFeed.feedType.rss']()}
          </RadioButton>
        </RadioButtonGroup>
        <Input
          autoFocus
          value={value}
          data-testid="input-collection-title"
          placeholder={t[`ai.readflow.editFeed.feedType.${feedType}.placeholder`]()}
          onChange={useCallback((value: string) => onChange(value), [onChange])}
          onEnter={save}
          onKeyDown={onKeyDown}
        ></Input>
        {showTips ? (
          <div className={styles.createTips}>
            {t[`ai.readflow.editFeed.feedType.${feedType}.createTips`]()}
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
