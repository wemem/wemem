import { cssVar } from '@toeverything/theme';
import { globalStyle, style } from '@vanilla-extract/css';
export const authModalContent = style({
  marginTop: '30px',
});
export const captchaWrapper = style({
  margin: 'auto',
  marginBottom: '4px',
  textAlign: 'center',
});
export const authMessage = style({
  marginTop: '30px',
  color: cssVar('textSecondaryColor'),
  fontSize: cssVar('fontXs'),
  lineHeight: 1.5,
});
globalStyle(`${authMessage} a`, {
  color: cssVar('linkColor'),
});
globalStyle(`${authMessage} .link`, {
  cursor: 'pointer',
  color: cssVar('linkColor'),
});
export const forgetPasswordButtonRow = style({
  position: 'absolute',
  right: 0,
  marginTop: '-26px', // Let this button be a tail of password input.
});
export const sendMagicLinkButtonRow = style({
  marginBottom: '30px',
});
export const linkButton = style({
  color: cssVar('linkColor'),
  background: 'transparent',
  borderColor: 'transparent',
  fontSize: cssVar('fontXs'),
  lineHeight: '22px',
  userSelect: 'none',
});
export const forgetPasswordButton = style({
  fontSize: cssVar('fontSm'),
  color: cssVar('textSecondaryColor'),
  position: 'absolute',
  right: 0,
  bottom: 0,
});
export const resendWrapper = style({
  height: 77,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 30,
});
export const sentRow = style({
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  lineHeight: '22px',
  fontSize: cssVar('fontSm'),
});
export const sentMessage = style({
  color: cssVar('textPrimaryColor'),
  fontWeight: 600,
});
export const resendCountdown = style({
  width: 45,
  textAlign: 'center',
});
export const resendCountdownInButton = style({
  width: 40,
  textAlign: 'center',
  fontSize: cssVar('fontSm'),
  marginLeft: 16,
  color: cssVar('blue'),
  fontWeight: 400,
});
export const accessMessage = style({
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: cssVar('fontXs'),
  fontWeight: 500,
  marginTop: 65,
  marginBottom: 40,
});
export const userPlanButton = style({
  display: 'flex',
  fontSize: cssVar('fontXs'),
  height: 20,
  fontWeight: 500,
  cursor: 'pointer',
  color: cssVar('pureWhite'),
  backgroundColor: cssVar('brandColor'),
  padding: '0 4px',
  borderRadius: 4,
  justifyContent: 'center',
  alignItems: 'center',

  selectors: {
    '&[data-is-believer="true"]': {
      // TODO(@CatsJuice): this color is new `Figma token` value without dark mode support.
      backgroundColor: '#374151',
    },
  },
});
