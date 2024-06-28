import { cssVar } from '@toeverything/theme';
import { createVar, keyframes, style } from '@vanilla-extract/css';

export const animationTimeout = createVar();

const contentShow = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(-2%) scale(0.96)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  },
});
const contentHide = keyframes({
  to: {
    opacity: 0,
    transform: 'translateY(-2%) scale(0.96)',
  },
  from: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  },
});

export const modalOverlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'transparent',
  zIndex: cssVar('zIndexModal'),
});

export const modalContentWrapper = style({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  zIndex: cssVar('zIndexModal'),
  right: '28px',
  top: '80px',
});

export const modalContent = style({
  width: 400,
  height: 48,
  backgroundColor: cssVar('backgroundOverlayPanelColor'),
  borderRadius: '8px',
  boxShadow: cssVar('shadow3'),
  minHeight: 48,
  // :focus-visible will set outline
  outline: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: `0.5px solid ${cssVar('borderColor')}`,
  padding: '8px 12px 8px 8px',
  zIndex: cssVar('zIndexModal'),
  willChange: 'transform, opacity',
  selectors: {
    '&[data-state=entered], &[data-state=entering]': {
      animation: `${contentShow} ${animationTimeout} cubic-bezier(0.42, 0, 0.58, 1)`,
      animationFillMode: 'forwards',
    },
    '&[data-state=exited], &[data-state=exiting]': {
      animation: `${contentHide} ${animationTimeout} cubic-bezier(0.42, 0, 0.58, 1)`,
      animationFillMode: 'forwards',
    },
  },
});

export const leftContent = style({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
});

export const searchIcon = style({
  fontSize: '20px',
  color: cssVar('iconColor'),
  verticalAlign: 'middle',
});

export const inputContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
  height: '32px',
  position: 'relative',
  padding: '0 8px',
  borderRadius: '4px',
  background: cssVar('white10'),
  border: `1px solid ${cssVar('borderColor')}`,
  selectors: {
    '&.active': {
      borderColor: cssVar('primaryColor'),
    },
  },
});
export const inputMain = style({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  height: '32px',
  position: 'relative',
});

export const input = style({
  position: 'absolute',
  padding: '0',
  inset: 0,
  height: '100%',
  width: '100%',
  color: 'transparent',
});

export const inputHack = style([
  input,
  {
    '::placeholder': {
      color: cssVar('textPrimaryColor'),
    },
    pointerEvents: 'none',
  },
]);

export const count = style({
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
  userSelect: 'none',
});

export const arrowButton = style({
  padding: '4px',
  fontSize: '24px',
  width: '32px',
  height: '32px',
  flexShrink: 0,
  border: '1px solid',
  borderColor: cssVar('borderColor'),
  color: cssVar('iconSecondary'),
  alignItems: 'baseline',
  background: 'transparent',
  selectors: {
    '&:hover': {
      color: cssVar('iconColor'),
    },
    '&.backward': {
      marginLeft: '8px',
      borderRadius: '4px 0 0 4px',
    },
    '&.forward': {
      borderLeft: 'none',
      borderRadius: '0 4px 4px 0',
    },
  },
});
export const closeButton = style({
  padding: '4px',
  fontSize: '20px',
  width: '24px',
  height: '24px',
  flexShrink: 0,
  color: cssVar('iconColor'),
  marginLeft: '8px',
});
