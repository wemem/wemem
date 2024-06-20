import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';
export const feedListHeader = style({
  height: 100,
  alignItems: 'center',
  padding: '48px 16px 20px 24px',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'space-between',
  background: cssVar('backgroundPrimaryColor'),
});
export const feedListHeaderTitle = style({
  fontSize: cssVar('fontH5'),
  fontWeight: 500,
  color: cssVar('textSecondaryColor'),
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  userSelect: 'none',
});
export const newFeedButton = style({
  padding: '6px 10px',
  borderRadius: '8px',
  background: cssVar('backgroundPrimaryColor'),
  fontSize: cssVar('fontXs'),
  fontWeight: 500,
  height: '28px',
});
