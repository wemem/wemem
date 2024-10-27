import { Loading } from '@affine/component';
import type { CommandCategory } from '@affine/core/commands';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import { i18nTime, useI18n } from '@affine/i18n';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import clsx from 'clsx';
import { Command } from 'cmdk';
import { useDebouncedValue } from 'foxact/use-debounced-value';
import { useAtom } from 'jotai';
import {
  type ReactNode,
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cmdkValueAtom, useCommandGroups } from './data-hooks';
import { HighlightLabel } from './highlight';
import * as styles from './main.css';
import type { FeedSearchModalProps } from './modal';
import { Modal } from './modal';
import { NotFoundGroup } from './not-found';
import type { FeedSearchCommand } from './types';

type NoParametersKeys<T> = {
  [K in keyof T]: T[K] extends () => any ? K : never;
}[keyof T];

type i18nKey = NoParametersKeys<ReturnType<typeof useI18n>>;

const categoryToI18nKey: Record<CommandCategory, i18nKey> = {
  'affine:recent': 'com.affine.cmdk.affine.category.affine.recent',
  'affine:navigation': 'com.affine.cmdk.affine.category.affine.navigation',
  'affine:creation': 'com.affine.cmdk.affine.category.affine.creation',
  'affine:general': 'com.affine.cmdk.affine.category.affine.general',
  'affine:layout': 'com.affine.cmdk.affine.category.affine.layout',
  'affine:pages': 'com.affine.cmdk.affine.category.affine.pages',
  'affine:edgeless': 'com.affine.cmdk.affine.category.affine.edgeless',
  'affine:collections': 'com.affine.cmdk.affine.category.affine.collections',
  'affine:settings': 'com.affine.cmdk.affine.category.affine.settings',
  'affine:updates': 'com.affine.cmdk.affine.category.affine.updates',
  'affine:help': 'com.affine.cmdk.affine.category.affine.help',
  'editor:edgeless': 'com.affine.cmdk.affine.category.editor.edgeless',
  'editor:insert-object':
    'com.affine.cmdk.affine.category.editor.insert-object',
  'editor:page': 'com.affine.cmdk.affine.category.editor.page',
  'affine:results': 'com.affine.cmdk.affine.category.results',
};

const SearchGroup = ({
  category,
  commands,
  onOpenChange,
}: {
  category: CommandCategory;
  commands: FeedSearchCommand[];
  onOpenChange?: (open: boolean) => void;
}) => {
  const t = useI18n();
  const i18nKey = categoryToI18nKey[category];
  const searchModal = useService(FeedsService).searchModal;
  const query = useLiveData(searchModal.query$);

  const onCommendSelect = useAsyncCallback(
    async (command: FeedSearchCommand) => {
      try {
        await command.run();
      } finally {
        onOpenChange?.(false);
      }
    },
    [onOpenChange]
  );

  return (
    <Command.Group key={category} heading={t[i18nKey]()}>
      {commands.map(command => {
        const label =
          typeof command.label === 'string'
            ? {
                title: command.label,
              }
            : command.label;
        return (
          <Command.Item
            key={command.id}
            onSelect={() => onCommendSelect(command)}
            value={command.value}
            data-is-danger={
              command.id === 'editor:page-move-to-trash' ||
              command.id === 'editor:edgeless-move-to-trash'
            }
          >
            <div className={styles.itemIcon}>{command.icon}</div>
            <div
              data-testid="cmdk-label"
              className={styles.itemLabel}
              data-value={command.value}
            >
              <HighlightLabel highlight={query} label={label} />
            </div>
            {command.timestamp ? (
              <div className={styles.timestamp}>
                {i18nTime(new Date(command.timestamp))}
              </div>
            ) : null}
            {command.keyBinding ? (
              <KeyBinding
                keyBinding={
                  typeof command.keyBinding === 'string'
                    ? command.keyBinding
                    : command.keyBinding.binding
                }
              />
            ) : null}
          </Command.Item>
        );
      })}
    </Command.Group>
  );
};

const SearchCommands = ({
  onOpenChange,
  groups,
}: {
  onOpenChange?: (open: boolean) => void;
  groups: ReturnType<typeof useCommandGroups>;
}) => {
  return (
    <>
      {groups.map(([category, commands]) => {
        return (
          <SearchGroup
            key={category}
            onOpenChange={onOpenChange}
            category={category}
            commands={commands}
          />
        );
      })}
    </>
  );
};

export function useDocEngineStatus() {
  const workspace = useService(WorkspaceService).workspace;

  const engineState = useLiveData(
    workspace.engine.docEngineState$.throttleTime(100)
  );
  const progress =
    (engineState.total - engineState.syncing) / engineState.total;

  return useMemo(
    () => ({
      ...engineState,
      progress,
      syncing: engineState.syncing > 0 || engineState.retrying,
    }),
    [engineState, progress]
  );
}

const ModalInnerContainer = ({
  className,
  onQueryChange,
  query,
  children,
  inputLabel,
  open,
  ...rest
}: React.PropsWithChildren<{
  open: boolean;
  className?: string;
  query: string;
  inputLabel?: ReactNode;
  groups: ReturnType<typeof useCommandGroups>;
  onQueryChange: (query: string) => void;
}>) => {
  const t = useI18n();
  const [value, setValue] = useAtom(cmdkValueAtom);
  const [opening, setOpening] = useState(open);
  const { syncing, progress } = useDocEngineStatus();
  const showLoading = useDebouncedValue(syncing, 500);

  const inputRef = useRef<HTMLInputElement>(null);

  // fix list height animation on opening
  useLayoutEffect(() => {
    if (open) {
      setOpening(true);
      const timeout = setTimeout(() => {
        setOpening(false);
        inputRef.current?.focus();
      }, 150);
      return () => {
        clearTimeout(timeout);
      };
    } else {
      setOpening(false);
    }
    return;
  }, [open]);

  return (
    <Command
      {...rest}
      data-testid="feed-search"
      shouldFilter={false}
      className={clsx(className, styles.panelContainer)}
      value={value}
      onValueChange={setValue}
      loop
    >
      {/* todo: add page context here */}
      {inputLabel ? (
        <div className={styles.pageTitleWrapper}>
          <span className={styles.pageTitle}>{inputLabel}</span>
        </div>
      ) : null}
      <div
        className={clsx(className, styles.searchInputContainer, {
          [styles.hasInputLabel]: inputLabel,
        })}
      >
        {showLoading ? (
          <Loading
            size={24}
            progress={progress ? Math.max(progress, 0.2) : undefined}
            speed={progress ? 0 : undefined}
          />
        ) : null}
        <Command.Input
          placeholder={t['ai.wemem.feeds.feed-search.placeholder']()}
          ref={inputRef}
          {...rest}
          value={query}
          onValueChange={onQueryChange}
          className={clsx(className, styles.searchInput)}
        />
      </div>

      <Command.List data-opening={opening ? true : undefined}>
        {children}
      </Command.List>
      <NotFoundGroup />
    </Command>
  );
};

const ModalInner = ({ open, ...props }: FeedSearchModalProps) => {
  const searchModal = useService(FeedsService).searchModal;
  const query = useLiveData(searchModal.query$);
  const folder = useLiveData(searchModal.currentFolder$);
  const groups = useCommandGroups();
  const t = useI18n();
  const inputLabel = useMemo(() => {
    return folder?.folderName
      ? t['ai.wemem.feeds.feed-search.modal-title-with-folder']({
          folderName: folder.folderName,
        })
      : t['ai.wemem.feeds.feed-search.modal-title']();
  }, [folder, t]);
  return (
    <ModalInnerContainer
      className={styles.root}
      query={query}
      groups={groups}
      onQueryChange={searchModal.setQuery}
      inputLabel={inputLabel}
      open={open}
    >
      <SearchCommands groups={groups} onOpenChange={props.onOpenChange} />
    </ModalInnerContainer>
  );
};

export const FeedSearchModal = ({
  open,
  onOpenChange,
}: FeedSearchModalProps) => {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Suspense fallback={<Command.Loading />}>
        <ModalInner open={open} onOpenChange={onOpenChange} />
      </Suspense>
    </Modal>
  );
};

const KeyBinding = ({ keyBinding }: { keyBinding: string }) => {
  const isMacOS = environment.isMacOs;
  const fragments = useMemo(() => {
    return keyBinding.split('+').map(fragment => {
      if (fragment === '$mod') {
        return isMacOS ? '⌘' : 'Ctrl';
      }
      if (fragment === 'ArrowUp') {
        return '↑';
      }
      if (fragment === 'ArrowDown') {
        return '↓';
      }
      if (fragment === 'ArrowLeft') {
        return '←';
      }
      if (fragment === 'ArrowRight') {
        return '→';
      }
      return fragment;
    });
  }, [isMacOS, keyBinding]);

  return (
    <div className={styles.keybinding}>
      {fragments.map((fragment, index) => {
        return (
          <div key={index} className={styles.keybindingFragment}>
            {fragment}
          </div>
        );
      })}
    </div>
  );
};

export const FeedSearchContainer = () => {
  const searchModal = useService(FeedsService).searchModal;
  const open = useLiveData(searchModal.show$);

  const onToggleFeedSearch = useCallback(
    (open: boolean) => {
      if (open) {
        // should never be here
        searchModal.show();
      } else {
        searchModal.hide();
      }
    },
    [searchModal]
  );

  return <FeedSearchModal open={open} onOpenChange={onToggleFeedSearch} />;
};
