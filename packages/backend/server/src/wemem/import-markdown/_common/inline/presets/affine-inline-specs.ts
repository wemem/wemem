import './nodes/index.js';

import type { InlineEditor, InlineRootElement } from '@blocksuite/inline';

export type AffineInlineEditor = InlineEditor<AffineTextAttributes>;
export type AffineInlineRootElement = InlineRootElement<AffineTextAttributes>;

export interface AffineTextAttributes {
  bold?: true | null;
  italic?: true | null;
  underline?: true | null;
  strike?: true | null;
  code?: true | null;
  link?: string | null;
  reference?: {
    type: 'Subpage' | 'LinkedPage';
    pageId: string;
  } | null;
  background?: string | null;
  color?: string | null;
}
