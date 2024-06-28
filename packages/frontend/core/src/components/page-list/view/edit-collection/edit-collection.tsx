import { Button, Modal, RadioGroup } from '@affine/component';
import { useAllPageListConfig } from '@affine/core/hooks/affine/use-all-page-list-config';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import type { DocCollection, DocMeta } from '@blocksuite/store';
import type { DialogContentProps } from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import * as styles from './edit-collection.css';
import { PagesMode } from './pages-mode';
import { RulesMode } from './rules-mode';

export type EditCollectionMode = 'page' | 'rule';

export interface EditCollectionModalProps {
  init?: Collection;
  title?: string;
  open: boolean;
  mode?: EditCollectionMode;
  onOpenChange: (open: boolean) => void;
  onConfirm: (view: Collection) => void;
}

const contentOptions: DialogContentProps = {
  onPointerDownOutside: e => {
    e.preventDefault();
  },
  style: {
    padding: 0,
    maxWidth: 944,
    backgroundColor: 'var(--affine-background-primary-color)',
  },
};
export const EditCollectionModal = ({
  init,
  onConfirm,
  open,
  onOpenChange,
  title,
  mode,
}: EditCollectionModalProps) => {
  const t = useI18n();
  const onConfirmOnCollection = useCallback(
    (view: Collection) => {
      onConfirm(view);
      onOpenChange(false);
    },
    [onConfirm, onOpenChange]
  );
  const onCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      withoutCloseButton
      width="calc(100% - 64px)"
      height="80%"
      contentOptions={contentOptions}
    >
      {open && init ? (
        <EditCollection
          title={title}
          onConfirmText={t['com.affine.editCollection.save']()}
          init={init}
          mode={mode}
          onCancel={onCancel}
          onConfirm={onConfirmOnCollection}
        />
      ) : null}
    </Modal>
  );
};

export interface EditCollectionProps {
  title?: string;
  onConfirmText?: string;
  init: Collection;
  mode?: EditCollectionMode;
  onCancel: () => void;
  onConfirm: (collection: Collection) => void;
}

export const EditCollection = ({
  init,
  onConfirm,
  onCancel,
  onConfirmText,
  mode: initMode,
}: EditCollectionProps) => {
  const t = useI18n();
  const config = useAllPageListConfig();
  const [value, onChange] = useState<Collection>(init);
  const [mode, setMode] = useState<'page' | 'rule'>(
    initMode ?? (init.filterList.length === 0 ? 'page' : 'rule')
  );
  const isNameEmpty = useMemo(() => value.name.trim().length === 0, [value]);
  const onSaveCollection = useCallback(() => {
    if (!isNameEmpty) {
      onConfirm(value);
    }
  }, [value, isNameEmpty, onConfirm]);
  const reset = useCallback(() => {
    onChange({
      ...value,
      filterList: init.filterList,
      allowList: init.allowList,
    });
  }, [init.allowList, init.filterList, value]);
  const buttons = useMemo(
    () => (
      <>
        <Button size="large" onClick={onCancel}>
          {t['com.affine.editCollection.button.cancel']()}
        </Button>
        <Button
          className={styles.confirmButton}
          size="large"
          data-testid="save-collection"
          type="primary"
          disabled={isNameEmpty}
          onClick={onSaveCollection}
        >
          {onConfirmText ?? t['com.affine.editCollection.button.create']()}
        </Button>
      </>
    ),
    [onCancel, t, isNameEmpty, onSaveCollection, onConfirmText]
  );
  const switchMode = useMemo(
    () => (
      <RadioGroup
        key="mode-switcher"
        style={{ minWidth: 158 }}
        value={mode}
        onChange={setMode}
        items={[
          {
            value: 'page',
            label: t['com.affine.editCollection.pages'](),
            testId: 'edit-collection-pages-button',
          },
          {
            value: 'rule',
            label: t['com.affine.editCollection.rules'](),
            testId: 'edit-collection-rules-button',
          },
        ]}
      />
    ),
    [mode, t]
  );
  return (
    <div
      onKeyDown={e => {
        if (e.key === 'Escape') {
          return;
        }
        e.stopPropagation();
      }}
      className={styles.collectionEditContainer}
    >
      {mode === 'page' ? (
        <PagesMode
          collection={value}
          updateCollection={onChange}
          switchMode={switchMode}
          buttons={buttons}
          allPageListConfig={config}
        ></PagesMode>
      ) : (
        <RulesMode
          allPageListConfig={config}
          collection={value}
          switchMode={switchMode}
          reset={reset}
          updateCollection={onChange}
          buttons={buttons}
        ></RulesMode>
      )}
    </div>
  );
};

export type AllPageListConfig = {
  allPages: DocMeta[];
  docCollection: DocCollection;
  isEdgeless: (id: string) => boolean;
  /**
   * Return `undefined` if the page is not public
   */
  getPublicMode: (id: string) => undefined | 'page' | 'edgeless';
  getPage: (id: string) => DocMeta | undefined;
  favoriteRender: (page: DocMeta) => ReactNode;
};
