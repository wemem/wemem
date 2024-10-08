import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';
export const placeholderButton = style({
  padding: '8px 18px',
  border: `1px solid ${cssVar('borderColor')}`,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 15,
  lineHeight: '24px',
  ':hover': {
    backgroundColor: cssVar('hoverColor'),
  },
});
export const button = style({
  userSelect: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  ':hover': {
    backgroundColor: cssVar('hoverColor'),
  },
});
export const headerCreateNewButton = style({
  transition: 'opacity 0.1s ease-in-out',
});
export const headerCreateNewFeedIconButton = style({
  padding: '4px 8px',
  fontSize: '16px',
  width: '32px',
  height: '28px',
  borderRadius: '8px',
});
export const headerCreateNewButtonHidden = style({
  opacity: 0,
  pointerEvents: 'none',
});

export const body = style({
  display: 'flex',
  flex: 1,
  height: '100%',
  width: '100%',
});

export const list = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  height: '100%',
  width: '100%',
});

export const PageListWrapperStyle = style({
  selectors: {
    '&[data-has-border=true]': {
      borderRight: `1px solid ${cssVar('borderColor')}`,
    },
    '&[data-is-floating="true"]': {
      backgroundColor: cssVar('backgroundPrimaryColor'),
    },
  },
});

export const subcriptionDocDetail = style({
  width: '100%',
  position: 'relative',
});
