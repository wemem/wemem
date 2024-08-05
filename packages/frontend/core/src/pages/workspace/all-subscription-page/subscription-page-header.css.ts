import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const header = style({
  display: 'flex',
  height: '52px',
  width: '100%',
  alignItems: 'center',
  flexShrink: 0,
  background: cssVar('backgroundPrimaryColor'),
  borderBottom: `1px solid ${cssVar('borderColor')}`,
  padding: '0 16px',
});

export const spacer = style({
  flexGrow: 1,
  minWidth: 12,
});

export const iconButtonContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

export const rightSidebarButton = style({
  transition: 'all 0.2s ease-in-out',
  selectors: {
    '&[data-show=true]': {
      opacity: 1,
      width: 32,
      maxWidth: 32,
      marginLeft: 16,
    },
    '&[data-show=false]': {
      opacity: 0,
      maxWidth: 0,
      marginLeft: 0,
    },
  },
});

export const editButton = style({
  padding: '4px 8px',
});

export const rightItemContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '0 8px',
});
