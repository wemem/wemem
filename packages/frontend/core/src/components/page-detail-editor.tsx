import './page-detail-editor.css';

import {
  SeenTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import type { AffineEditorContainer } from '@blocksuite/affine/presets';
import type { Doc, DocCollection } from '@blocksuite/affine/store';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { useEffect, useMemo } from 'react';

import { EditorService } from '../modules/editor';
import {
  EditorSettingService,
  fontStyleOptions,
} from '../modules/editor-settting';
import { BlockSuiteEditor as Editor } from './blocksuite/block-suite-editor';
import * as styles from './page-detail-editor.css';

declare global {
  // eslint-disable-next-line no-var
  var currentEditor: AffineEditorContainer | undefined;
}

export type OnLoadEditor = (
  editor: AffineEditorContainer
) => (() => void) | void;

export interface PageDetailEditorProps {
  onLoad?: OnLoadEditor;
  docCollection?: DocCollection;
}

// when the page is opened, we need to set the page as seen
// for the feed page
const setPageAsSeen = (docCollection: DocCollection, blockSuiteDoc?: Doc) => {
  if (!blockSuiteDoc) {
    return;
  }
  if (blockSuiteDoc.meta?.tags.includes(UnseenTag.id)) {
    const tags = blockSuiteDoc.meta.tags.filter(tag => tag !== UnseenTag.id);
    tags.push(SeenTag.id);
    docCollection.setDocMeta(blockSuiteDoc.id, {
      ...blockSuiteDoc.meta,
      tags,
    });
  }
};

export const PageDetailEditor = ({
  onLoad,
  docCollection,
}: PageDetailEditorProps) => {
  const editor = useService(EditorService).editor;
  const mode = useLiveData(editor.mode$);

  const isSharedMode = editor.isSharedMode;
  const editorSetting = useService(EditorSettingService).editorSetting;
  const settings = useLiveData(
    editorSetting.settings$.selector(s => ({
      fontFamily: s.fontFamily,
      customFontFamily: s.customFontFamily,
      fullWidthLayout: s.fullWidthLayout,
    }))
  );

  const value = useMemo(() => {
    const fontStyle = fontStyleOptions.find(
      option => option.key === settings.fontFamily
    );
    if (!fontStyle) {
      return cssVar('fontSansFamily');
    }
    const customFontFamily = settings.customFontFamily;

    return customFontFamily && fontStyle.key === 'Custom'
      ? `${customFontFamily}, ${fontStyle.value}`
      : fontStyle.value;
  }, [settings.customFontFamily, settings.fontFamily]);

  useEffect(() => {
    if (docCollection) {
      setPageAsSeen(docCollection, editor.doc.blockSuiteDoc);
    }
  }, [editor.doc.blockSuiteDoc, docCollection]);

  return (
    <Editor
      className={clsx(styles.editor, {
        'full-screen': !isSharedMode && settings.fullWidthLayout,
        'is-public': isSharedMode,
      })}
      style={
        {
          '--affine-font-family': value,
        } as CSSProperties
      }
      mode={mode}
      page={editor.doc.blockSuiteDoc}
      shared={isSharedMode}
      onEditorReady={onLoad}
    />
  );
};
