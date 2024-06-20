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

export const feedTypeWrapper = style({
  flexGrow: 1,
  display: 'flex',
  justifyContent: 'flex-end',
  minWidth: '150px',
  maxWidth: '250px',
});

