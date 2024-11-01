import './page-detail-editor.css';

import type { AffineEditorContainer } from '@blocksuite/affine/presets';
import type { DocCollection } from '@blocksuite/affine/store';
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
import { useDocReadStatus } from './feeds-page-list/feeds-hooks';
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

export const PageDetailEditor = ({ onLoad }: PageDetailEditorProps) => {
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

  // when the page is opened, we need to set the page as read
  // for the feed page
  const { read, toggleRead } = useDocReadStatus(editor.doc.blockSuiteDoc.id);
  useEffect(() => {
    if (!read) {
      toggleRead();
    }
  }, [editor.doc.blockSuiteDoc, read, toggleRead]);

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
