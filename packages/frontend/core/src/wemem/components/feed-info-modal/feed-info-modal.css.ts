import { rowHPadding } from '@affine/core/components/affine/page-properties/styles.css';
import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const container = style({
  maxWidth: 480,
  minWidth: 360,
  padding: '20px 0',
  alignSelf: 'start',
  marginTop: '120px',
  vars: {
    [rowHPadding]: '6px',
  },
});

export const titleContainer = style({
  display: 'flex',
  width: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
});

export const titleStyle = style({
  fontSize: cssVar('fontH6'),
  fontWeight: '600',
  textAlign: 'center',
  padding: '0 24px',
});

export const rowNameContainer = style({
  display: 'flex',
  flexDirection: 'row',
  gap: 6,
  padding: 6,
  width: '160px',
});

export const viewport = style({
  maxHeight: 'calc(100vh - 220px)',
  padding: '0 24px',
});

export const scrollBar = style({
  width: 6,
  transform: 'translateX(-4px)',
});

export const hiddenInput = style({
  width: '0',
  height: '0',
  position: 'absolute',
});

export const infoTable = style({
  marginTop: 20,
  borderBottom: 4,
});
