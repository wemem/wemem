import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';
export const root = style({
  display: 'inline-flex',
  width: '100%',
  position: 'relative',
  height: '52px',
  userSelect: 'none',
  transition: 'background 0.2s ease',
  selectors: {
    '&:active': {
      background: cssVar('white50'),
    },
  },
  gap: '4px',
});

export const button = style({
  fontSize: cssVar('fontSm'),
  cursor: 'pointer',
  height: '100%',
  display: 'inline-flex',
});

export const icon = style({
  color: cssVar('iconColor'),
  fontSize: '20px',
});
export const spacer = style({
  flex: 1,
});
