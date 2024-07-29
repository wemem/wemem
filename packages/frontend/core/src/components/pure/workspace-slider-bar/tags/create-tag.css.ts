import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';
export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: 20,
  gap: 20,
});
export const createTips = style({
  color: cssVar('textSecondaryColor'),
  fontSize: 12,
  lineHeight: '20px',
});
export const label = style({
  color: cssVar('textSecondaryColor'),
  fontSize: 14,
  lineHeight: '22px',
});
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px 0px 20px',
  marginBottom: 8,
});

export const createTagWrapper = style({
  alignItems: 'center',
  borderRadius: '8px',
  display: 'flex',
  fontSize: cssVar('fontXs'),
  selectors: {
    '&[data-show="false"]': {
      display: 'none',
      pointerEvents: 'none',
    },
  },
});

export const tagItemsWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4px',
});

export const menuBtn = style({
  padding: '0px 10px',
  marginRight: '4px',
});

export const tagItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  padding: '2px',
  cursor: 'pointer',
  border: `1px solid ${cssVar('backgroundOverlayPanelColor')}`,
  ':hover': {
    boxShadow: `0 0 0 1px ${cssVar('primaryColor')}`,
  },
  selectors: {
    '&.active': {
      boxShadow: `0 0 0 1px ${cssVar('primaryColor')}`,
    },
  },
});
