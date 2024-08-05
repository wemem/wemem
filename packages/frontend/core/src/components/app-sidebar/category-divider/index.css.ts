import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';
export const root = style({
  fontSize: cssVar('fontXs'),
  minHeight: '16px',
  width: 'calc(100% + 6px)',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '4px',
  padding: '0 8px',
  selectors: {
    '&:not(:first-of-type)': {
      marginTop: '16px',
    },
  },
});
export const label = style({
  color: cssVar('black30'),
  display: 'flex',
});

export const linkItemRoot = style({
  color: 'inherit',
});

export const collapsedRoot = style({
  fontSize: cssVar('fontXs'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '4px',
  minHeight: '16px',
  width: 'calc(100% + 6px)',
  textAlign: 'left',
  color: 'inherit',
  userSelect: 'none',
  cursor: 'pointer',
  marginBottom: '4px',
  padding: '4px 8px',
  position: 'relative',
  selectors: {
    '&:hover': {
      background: cssVar('hoverColor'),
    },
    '&[data-active="true"]': {
      background: cssVar('hoverColor'),
    },
    '&[data-disabled="true"]': {
      cursor: 'default',
      color: cssVar('textSecondaryColor'),
      pointerEvents: 'none',
    },
    // this is not visible in dark mode
    // '&[data-active="true"]:hover': {
    //   background:
    //     // make this a variable?
    //     'linear-gradient(0deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04)), rgba(0, 0, 0, 0.04)',
    // },
    '&[data-collapsible="true"]': {
      paddingLeft: '4px',
      paddingRight: '4px',
    },
    '&[data-collapsible="false"]:is([data-active="true"], :hover)': {
      width: 'calc(100% + 8px)',
      transform: 'translateX(-8px)',
      paddingLeft: '20px',
      paddingRight: '12px',
    },
    [`${linkItemRoot}:first-of-type &`]: {
      marginTop: '0px',
    },
  },
});

export const collapsedIconContainer = style({
  width: '17px',
  height: '17px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '2px',
  transition: 'transform 0.2s',
  color: 'inherit',
  selectors: {
    '&[data-collapsed="true"]': {
      transform: 'rotate(-90deg)',
    },
    '&[data-disabled="true"]': {
      opacity: 0.3,
      pointerEvents: 'none',
    },
    '&:hover': {
      background: cssVar('hoverColor'),
    },
  },
});
export const iconsContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  width: '28px',
  flexShrink: 0,
  selectors: {
    '&[data-collapsible="true"]': {
      width: '44px',
    },
  },
});
export const collapsedIcon = style({
  transition: 'transform 0.2s ease-in-out',
  selectors: {
    '&[data-collapsed="true"]': {
      transform: 'rotate(-90deg)',
    },
  },
});
