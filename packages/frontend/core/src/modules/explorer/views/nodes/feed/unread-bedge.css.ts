import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

import { itemRoot } from '../../tree/node.css';

export const unreadBadge = style({
  display: 'flex',
  alignItems: 'center',
  right: 0,
  position: 'absolute',
  opacity: 1,
  color: cssVar('--affine-text-secondary-color'),
  fontSize: cssVar('--affine-font-xs'),
  pointerEvents: 'none',
  lineHeight: cssVar('--affine-line-height'),
  marginRight: 4,
  selectors: {
    [`${itemRoot}:hover &`]: {
      opacity: 0,
      pointerEvents: 'initial',
      position: 'initial',
    },
  },
});
