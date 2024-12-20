import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const icon = style({
  fontSize: 16,
  color: cssVar('iconSecondary'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const rowNameContainer = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',

  gap: 6,
  padding: 6,
  minWidth: '90px',
});

export const rowName = style({
  flexGrow: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: cssVar('fontSm'),
  color: cssVar('textSecondaryColor'),
});

export const rowValue = style({
  display: 'flex',
  alignItems: 'left',
  padding: '6px 8px',
  flexGrow: 1,
  fontSize: cssVar('fontSm'),
});

export const rowCell = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 4,
});

export const container = style({
  display: 'flex',
  flexDirection: 'column',
});
