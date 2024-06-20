import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const filterMenuTrigger = style({
  padding: '6px 8px',
  ':hover': {
    backgroundColor: cssVar('hoverColor'),
  },
  selectors: {
    [`&[data-is-hidden="true"]`]: {
      display: 'none',
    },
  },
});
