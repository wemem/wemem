import { cssVar } from '@toeverything/theme';
import { globalStyle, style } from '@vanilla-extract/css';
export const root = style({
  display: 'flex',
  color: cssVar('textPrimaryColor'),
  minHeight: '84px',
  maxHeight: '120px',
  // 42 + 12
  flexShrink: 0,
  width: '100%',
  alignItems: 'stretch',
  transition: 'background-color 0.2s, opacity 0.2s',
  ':hover': {
    backgroundColor: cssVar('hoverColor'),
  },
  margin: '6px 0',
  overflow: 'hidden',
  cursor: 'default',
  willChange: 'opacity',
  selectors: {
    '&[data-clickable=true]': {
      cursor: 'pointer',
    },
  },
});

export const dragPageItemOverlay = style({
  height: '54px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  background: cssVar('hoverColorFilled'),
  boxShadow: cssVar('menuShadow'),
  maxWidth: '360px',
  minWidth: '260px',
});
export const dndCell = style({
  position: 'relative',
  marginLeft: -8,
  height: '100%',
  outline: 'none',
  paddingLeft: 8,
});
globalStyle(`[data-draggable=true] ${dndCell}:before`, {
  content: '""',
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  left: 0,
  width: 4,
  height: 4,
  transition: 'height 0.2s, opacity 0.2s',
  backgroundColor: cssVar('placeholderColor'),
  borderRadius: '2px',
  opacity: 0,
  willChange: 'height, opacity',
});
globalStyle(`[data-draggable=true] ${dndCell}:hover:before`, {
  height: 12,
  opacity: 1,
});
globalStyle(`[data-draggable=true][data-dragging=true] ${dndCell}`, {
  opacity: 0.5,
});
globalStyle(`[data-draggable=true][data-dragging=true] ${dndCell}:before`, {
  height: 32,
  width: 2,
  opacity: 1,
});

globalStyle(`${root} > :first-child`, {
  paddingLeft: '16px',
});
globalStyle(`${root} > :last-child`, {
  paddingRight: '8px',
});
export const titleIconsWrapper = style({
  padding: '0 5px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
});
export const selectionCell = style({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  fontSize: cssVar('fontH3'),
});
export const titleCell = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: '0 16px',
  width: '100%',
  flex: 1,
  whiteSpace: 'nowrap',
  userSelect: 'none',
  gap: '4px',
});

export const titleCellMain = style({
  overflow: 'hidden',
  fontSize: cssVar('fontSm'),
  fontWeight: 600,
  whiteSpace: 'normal',
  flex: 1,
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  textOverflow: 'ellipsis',
  wordBreak: 'break-word',
  maxHeight: '3em', // 根据字体大小调整
});

export const titleCellMainForSubcription = style({
  whiteSpace: 'normal !important',
  alignSelf: 'stretch',
  display: '-webkit-box !important',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2, // 限制显示的最大行数为2行
  wordBreak: 'break-word', // 允许长单词在必要时换行
  maxHeight: '3.4em',
});

export const titleCellPreview = style({
  overflow: 'hidden',
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
  flex: 1,
  textOverflow: 'ellipsis',
  alignSelf: 'stretch',
  whiteSpace: 'normal',
  display: '-webkit-box !important',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2, // 限制显示的最大行数为2行
  wordBreak: 'break-word', // 允许长单词在必要时换行
  maxHeight: '3.4em',
});
export const iconCell = style({
  display: 'flex',
  alignItems: 'center',
  fontSize: cssVar('fontH3'),
  color: cssVar('iconColor'),
  flexShrink: 0,
});
export const tagsCell = style({
  display: 'flex',
  alignItems: 'center',
  fontSize: cssVar('fontXs'),
  color: cssVar('textSecondaryColor'),
  padding: '0 0px',
  height: '32px',
  width: '100%',
});
export const dateCell = style({
  userSelect: 'none',
  marginRight: '4px',
});
export const actionsCellWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexShrink: 0,
});
export const operationsCell = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  columnGap: '6px',
  flexShrink: 0,
});

export const unreadLabel = style({
  width: '20px',
  minWidth: '20px',
  height: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  selectors: {
    '&::after': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: cssVar('primaryColor'),
    },
  },
});

export const readColor = style({
  color: cssVar('textSecondaryColor'),
});

export const unreadColor = style({
  color: cssVar('textPrimaryColor'),
});
