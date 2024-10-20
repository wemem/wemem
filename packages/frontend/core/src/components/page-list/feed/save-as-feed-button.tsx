import { Button } from '@affine/component';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { SaveIcon } from '@blocksuite/icons/rc';
import { nanoid } from 'nanoid';
import { useCallback } from 'react';

import { createEmptyCollection } from '../use-collection-manager';
import * as styles from './save-as-feed-button.css';
import { useCreateFeedModal } from './use-create-feed-modal';

interface SaveAsFeedButtonProps {
  onConfirm: (collection: Collection) => void;
}

export const SaveAsFeedButton = ({
  onConfirm,
}: SaveAsFeedButtonProps) => {
  const t = useI18n();
  const { open, node } = useCreateFeedModal({
    title: t['com.affine.editCollection.saveCollection'](),
    showTips: true,
  });
  const handleClick = useCallback(() => {
    open('')
      .then(name => {
        return onConfirm(createEmptyCollection(nanoid(), { name }));
      })
      .catch(err => {
        console.error(err);
      });
  }, [open, onConfirm]);
  return (
    <>
      <Button
        onClick={handleClick}
        data-testid="save-as-collection"
        icon={<SaveIcon />}
        className={styles.button}
      >
        {t['com.affine.editCollection.saveCollection']()}
      </Button>
      {node}
    </>
  );
};
