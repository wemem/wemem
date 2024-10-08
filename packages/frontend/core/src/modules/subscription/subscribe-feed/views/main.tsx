import { Loading } from '@affine/component/ui/loading';
import type { CommandCategory } from '@affine/core/commands';
import { useDocEngineStatus } from '@affine/core/hooks/affine/use-doc-engine-status';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { i18nTime, useI18n } from '@affine/i18n';
import type { DocMeta } from '@blocksuite/store';
import {
  DocsService,
  GlobalContextService,
  useLiveData,
  useService,
} from '@toeverything/infra';
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

import { NewSubscriptionService } from '../services/subscriptions-service';
import {
  cmdkValueAtom,
  useCMDKCommandGroups,
  useSearchCallbackCommandGroups,
} from './data-hooks';
import { HighlightLabel } from './highlight';
import * as styles from './main.css';
import type { CMDKModalProps } from './modal';
import { CMDKModal } from './modal';
import { NotFoundGroup } from './not-found';
import type { CMDKCommand } from './types';

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

const QuickSearchGroup = ({
  category,
  commands,
  onOpenChange,
}: {
  category: CommandCategory;
  commands: CMDKCommand[];
  onOpenChange?: (open: boolean) => void;
}) => {
  const t = useI18n();
  const i18nKey = categoryToI18nKey[category];
  const subscribeFeed = useService(NewSubscriptionService).subscribeFeed;
  const query = useLiveData(subscribeFeed.query$);

  const onCommendSelect = useAsyncCallback(
    async (command: CMDKCommand) => {
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
              <CMDKKeyBinding
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

const QuickSearchCommands = ({
  onOpenChange,
  groups,
}: {
  onOpenChange?: (open: boolean) => void;
  groups: ReturnType<typeof useCMDKCommandGroups>;
}) => {
  return (
    <>
      {groups.map(([category, commands]) => {
        return (
          <QuickSearchGroup
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

export const CMDKContainer = ({
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
  groups: ReturnType<typeof useCMDKCommandGroups>;
  onQueryChange: (query: string) => void;
}>) => {
  const t = useI18n();
  const [value, setValue] = useAtom(cmdkValueAtom);
  const [opening, setOpening] = useState(open);
  const { syncing, progress } = useDocEngineStatus();
  const showLoading = useDebouncedValue(syncing, 500);
  const subscribeFeed = useService(NewSubscriptionService).subscribeFeed;
  const mode = useLiveData(subscribeFeed.mode$);

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
      data-testid="cmdk-quick-search"
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
          placeholder={t['ai.wemem.subscription.new-feed.placeholder']()}
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
      {mode === 'commands' ? <NotFoundGroup /> : null}
    </Command>
  );
};

const CMDKQuickSearchModalInner = ({
  pageMeta,
  open,
  ...props
}: CMDKModalProps & { pageMeta?: Partial<DocMeta> }) => {
  const subscribeFeed = useService(NewSubscriptionService).subscribeFeed;
  const query = useLiveData(subscribeFeed.query$);
  const groups = useCMDKCommandGroups();
  const t = useI18n();
  return (
    <CMDKContainer
      className={styles.root}
      query={query}
      groups={groups}
      onQueryChange={subscribeFeed.setQuery}
      inputLabel={t['ai.wemem.subscription.new-feed-button']()}
      open={open}
    >
      <QuickSearchCommands groups={groups} onOpenChange={props.onOpenChange} />
    </CMDKContainer>
  );
};

const CMDKQuickSearchCallbackModalInner = ({
  open,
  ...props
}: CMDKModalProps & { pageMeta?: Partial<DocMeta> }) => {
  const subscribeFeed = useService(NewSubscriptionService).subscribeFeed;
  const query = useLiveData(subscribeFeed.query$);
  const groups = useSearchCallbackCommandGroups();
  const t = useI18n();
  return (
    <CMDKContainer
      className={styles.root}
      query={query}
      groups={groups}
      onQueryChange={subscribeFeed.setQuery}
      inputLabel={t['com.affine.cmdk.insert-links']()}
      open={open}
    >
      <QuickSearchCommands groups={groups} onOpenChange={props.onOpenChange} />
    </CMDKContainer>
  );
};

export const NewFeedModal = ({
  pageMeta,
  open,
  ...props
}: CMDKModalProps & { pageMeta?: Partial<DocMeta> }) => {
  const subscribeFeed = useService(NewSubscriptionService).subscribeFeed;
  const mode = useLiveData(subscribeFeed.mode$);
  const InnerComp =
    mode === 'commands'
      ? CMDKQuickSearchModalInner
      : CMDKQuickSearchCallbackModalInner;

  return (
    <CMDKModal open={open} {...props}>
      <Suspense fallback={<Command.Loading />}>
        <InnerComp
          pageMeta={pageMeta}
          open={open}
          onOpenChange={props.onOpenChange}
        />
      </Suspense>
    </CMDKModal>
  );
};

const CMDKKeyBinding = ({ keyBinding }: { keyBinding: string }) => {
  const isMacOS = environment.isBrowser && environment.isMacOs;
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

export const NewFeedModalComponent = () => {
  const subscribeFeed = useService(NewSubscriptionService).subscribeFeed;
  const open = useLiveData(subscribeFeed.show$);

  const onToggleQuickSearch = useCallback(
    (open: boolean) => {
      if (open) {
        // should never be here
        subscribeFeed.show();
      } else {
        subscribeFeed.hide();
      }
    },
    [subscribeFeed]
  );

  const docRecordList = useService(DocsService).list;
  const currentDocId = useLiveData(
    useService(GlobalContextService).globalContext.docId.$
  );
  const currentPage = useLiveData(
    currentDocId ? docRecordList.doc$(currentDocId) : null
  );
  const pageMeta = useLiveData(currentPage?.meta$);

  return (
    <NewFeedModal
      open={open}
      onOpenChange={onToggleQuickSearch}
      pageMeta={pageMeta}
    />
  );
};
