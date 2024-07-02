import type { MenuProps } from '@affine/component';
import { IconButton, Input, Menu, Scrollable } from '@affine/component';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { WorkspaceLegacyProperties } from '@affine/core/modules/properties';
import { DeleteTagConfirmModal, TagService } from '@affine/core/modules/tag';
import { isInternalTag } from '@affine/core/modules/tag/entities/internal-tag';
import { useI18n } from '@affine/i18n';
import { DeleteIcon, MoreHorizontalIcon, TagsIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';

import { TagItem, TempTagItem } from '../../page-list';
import { tagColors } from './common';
import type { MenuItemOption } from './menu-items';
import { renderMenuItemOptions } from './menu-items';
import * as styles from './tags-inline-editor.css';

interface TagsEditorProps {
  pageId: string;
  readonly?: boolean;
}

interface InlineTagsListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Omit<TagsEditorProps, 'onOptionsChange'> {
  onRemove?: () => void;
}

const InlineTagsList = ({
  pageId,
  readonly,
  children,
  onRemove,
}: PropsWithChildren<InlineTagsListProps>) => {
  const tagList = useService(TagService).tagList;
  const tags = useLiveData(tagList.tags$);
  const tagIds = useLiveData(tagList.tagIdsByPageId$(pageId));

  return (
    <div className={styles.inlineTagsContainer} data-testid="inline-tags-list">
      {tagIds.map((tagId, idx) => {
        const tag = tags.find(t => t.id === tagId);
        if (!tag) {
          return null;
        }
        const onRemoved = readonly
          ? undefined
          : () => {
              tag.untag(pageId);
              onRemove?.();
            };
        return (
          <TagItem
            key={tagId}
            idx={idx}
            onRemoved={onRemoved}
            mode="inline"
            tag={tag}
          />
        );
      })}
      {children}
    </div>
  );
};

export const EditTagMenu = ({
  tagId,
  onTagDelete,
  children,
}: PropsWithChildren<{
  tagId: string;
  onTagDelete: (tagIds: string[]) => void;
}>) => {
  const t = useI18n();
  const legacyProperties = useService(WorkspaceLegacyProperties);
  const tagList = useService(TagService).tagList;
  const tag = useLiveData(tagList.tagByTagId$(tagId));
  const tagColor = useLiveData(tag?.color$);
  const tagValue = useLiveData(tag?.value$);
  const navigate = useNavigateHelper();

  const menuProps = useMemo(() => {
    const options: MenuItemOption[] = [];
    const updateTagName = (name: string) => {
      if (name.trim() === '') {
        return;
      }
      tag?.rename(name);
    };
    options.push(
      <Input
        defaultValue={tagValue}
        onBlur={e => {
          updateTagName(e.currentTarget.value);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            e.preventDefault();
            updateTagName(e.currentTarget.value);
          }
        }}
        placeholder={t['Untitled']()}
      />
    );

    options.push('-');

    options.push({
      text: t['Delete'](),
      icon: <DeleteIcon />,
      type: 'danger',
      onClick() {
        onTagDelete([tag?.id || '']);
      },
    });

    options.push({
      text: t['com.affine.page-properties.tags.open-tags-page'](),
      icon: <TagsIcon />,
      onClick() {
        navigate.jumpToTag(legacyProperties.workspaceId, tag?.id || '');
      },
    });

    options.push('-');

    options.push(
      tagColors.map(([name, color], i) => {
        return {
          text: name,
          icon: (
            <div key={i} className={styles.tagColorIconWrapper}>
              <div
                className={styles.tagColorIcon}
                style={{
                  backgroundColor: color,
                }}
              />
            </div>
          ),
          checked: tagColor === color,
          onClick() {
            tag?.changeColor(color);
          },
        };
      })
    );
    const items = renderMenuItemOptions(options);

    return {
      contentOptions: {
        onClick(e) {
          e.stopPropagation();
        },
      },
      items,
    } satisfies Partial<MenuProps>;
  }, [
    legacyProperties.workspaceId,
    navigate,
    onTagDelete,
    t,
    tag,
    tagColor,
    tagValue,
  ]);

  return <Menu {...menuProps}>{children}</Menu>;
};

export const TagsEditor = ({ pageId, readonly }: TagsEditorProps) => {
  const t = useI18n();
  const tagList = useService(TagService).tagList;
  const tags = useLiveData(tagList.tags$);
  const tagIds = useLiveData(tagList.tagIdsByPageId$(pageId));
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCloseModal = useCallback(
    (open: boolean) => {
      setOpen(open);
      setSelectedTagIds([]);
    },
    [setOpen]
  );

  const onTagDelete = useCallback(
    (tagIds: string[]) => {
      setOpen(true);
      setSelectedTagIds(tagIds);
    },
    [setOpen, setSelectedTagIds]
  );

  const exactMatch = useLiveData(tagList.tagByTagValue$(inputValue));

  const filteredTags = useLiveData(
    inputValue ? tagList.filterTagsByName$(inputValue) : tagList.tags$
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const onAddTag = useCallback(
    (id: string) => {
      if (!tagIds.includes(id)) {
        tags.find(o => o.id === id)?.tag(pageId);
      }
    },
    [pageId, tagIds, tags]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const [nextColor, rotateNextColor] = useReducer(
    color => {
      const idx = tagColors.findIndex(c => c[1] === color);
      return tagColors[(idx + 1) % tagColors.length][1];
    },
    tagColors[Math.floor(Math.random() * tagColors.length)][1]
  );

  const onCreateTag = useCallback(
    (name: string) => {
      if (!name.trim()) {
        return;
      }
      rotateNextColor();
      const newTag = tagList.createTag(name.trim(), nextColor);
      newTag.tag(pageId);
    },
    [nextColor, pageId, tagList]
  );

  const onSelectTag = useCallback(
    (id: string) => {
      onAddTag(id);
      setInputValue('');
      focusInput();
    },
    [focusInput, onAddTag]
  );

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (exactMatch) {
          onAddTag(exactMatch.id);
        } else {
          onCreateTag(inputValue);
        }
        setInputValue('');
      } else if (e.key === 'Backspace' && inputValue === '' && tagIds.length) {
        const lastTagId = tagIds[tagIds.length - 1];
        tags.find(tag => tag.id === lastTagId)?.untag(pageId);
      }
    },
    [exactMatch, inputValue, onAddTag, onCreateTag, pageId, tagIds, tags]
  );

  return (
    <div data-testid="tags-editor-popup" className={styles.tagsEditorRoot}>
      <div className={styles.tagsEditorSelectedTags}>
        <InlineTagsList
          pageId={pageId}
          readonly={readonly}
          onRemove={focusInput}
        >
          <input
            ref={inputRef}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
            autoFocus
            className={styles.searchInput}
            placeholder="Type here ..."
          />
        </InlineTagsList>
      </div>
      <div className={styles.tagsEditorTagsSelector}>
        <div className={styles.tagsEditorTagsSelectorHeader}>
          {t['com.affine.page-properties.tags.selector-header-title']()}
        </div>
        <Scrollable.Root>
          <Scrollable.Viewport
            className={styles.tagSelectorTagsScrollContainer}
          >
            {filteredTags.map(tag => {
              return (
                <div
                  key={tag.id}
                  className={styles.tagSelectorItem}
                  data-testid="tag-selector-item"
                  data-tag-id={tag.id}
                  data-tag-value={tag.value$}
                  onClick={() => {
                    onSelectTag(tag.id);
                  }}
                >
                  <TagItem maxWidth="100%" tag={tag} mode="inline" />
                  <div className={styles.spacer} />
                  {!isInternalTag(tag.value$.getValue()) && (
                    <EditTagMenu tagId={tag.id} onTagDelete={onTagDelete}>
                      <IconButton
                        className={styles.tagEditIcon}
                        type="plain"
                        icon={<MoreHorizontalIcon />}
                      />
                    </EditTagMenu>
                  )}
                </div>
              );
            })}
            {exactMatch || !inputValue ? null : (
              <div
                data-testid="tag-selector-item"
                className={styles.tagSelectorItem}
                onClick={() => {
                  setInputValue('');
                  onCreateTag(inputValue);
                }}
              >
                {t['Create']()}{' '}
                <TempTagItem value={inputValue} color={nextColor} />
              </div>
            )}
          </Scrollable.Viewport>
          <Scrollable.Scrollbar style={{ transform: 'translateX(6px)' }} />
        </Scrollable.Root>
      </div>
      <DeleteTagConfirmModal
        open={open}
        onOpenChange={handleCloseModal}
        selectedTagIds={selectedTagIds}
      />
    </div>
  );
};

interface TagsInlineEditorProps extends TagsEditorProps {
  placeholder?: string;
  className?: string;
}

// this tags value renderer right now only renders the legacy tags for now
export const TagsInlineEditor = ({
  pageId,
  readonly,
  placeholder,
  className,
}: TagsInlineEditorProps) => {
  const tagList = useService(TagService).tagList;
  const tagIds = useLiveData(tagList.tagIdsByPageId$(pageId));
  const empty = !tagIds || tagIds.length === 0;
  return (
    <Menu
      contentOptions={{
        side: 'bottom',
        align: 'start',
        sideOffset: 0,
        avoidCollisions: false,
        className: styles.tagsMenu,
        onClick(e) {
          e.stopPropagation();
        },
      }}
      items={<TagsEditor pageId={pageId} readonly={readonly} />}
    >
      <div
        className={clsx(styles.tagsInlineEditor, className)}
        data-empty={empty}
        data-readonly={readonly}
      >
        {empty ? placeholder : <InlineTagsList pageId={pageId} readonly />}
      </div>
    </Menu>
  );
};
