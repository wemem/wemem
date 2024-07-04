import {
  cssVar,
  darkCssVariables,
  lightCssVariables,
} from '@toeverything/theme';
import { globalStyle } from '@vanilla-extract/css';
globalStyle('body', {
  color: cssVar('textPrimaryColor'),
  fontFamily: cssVar('fontFamily'),
  fontSize: cssVar('fontBase'),
});
globalStyle('html', {
  vars: {
    ...lightCssVariables,
    '--affine-brand-color': 'hsl(240 5.9% 10%)',
    '--affine-primary-color': 'hsl(240 5.9% 10%)',
    '--affine-active-shadow': '#000',
  },
});
globalStyle('html[data-theme="dark"]', {
  vars: {
    ...darkCssVariables,
    '--affine-brand-color': 'hsl(0 0% 98%)',
    '--affine-primary-color': 'hsl(0 0% 98%)',
    '--affine-toggle-circle-background-color': '#000',
    '--affine-pure-white': '#000',
    '--affine-active-shadow': 'rgba(0,0,0,.05)',
  },
});
if (process.env.NODE_ENV === 'development') {
  globalStyle('.undefined', {
    border: '5px solid red !important',
  });
}
