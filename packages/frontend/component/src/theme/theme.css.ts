import { cssVar } from '@toeverything/theme';
import { globalStyle } from '@vanilla-extract/css';

globalStyle('body', {
  color: cssVar('textPrimaryColor'),
  fontFamily: cssVar('fontFamily'),
  fontSize: cssVar('fontBase'),
});

if (process.env.NODE_ENV === 'development') {
  globalStyle('.undefined', {
    border: '5px solid red !important',
  });
}

globalStyle('[data-theme="light"]', {
  vars: {
    '--affine-brand-color': 'hsl(240 5.9% 10%)',
    '--affine-primary-color': 'hsl(240 5.9% 10%)',
    '--affine-active-shadow': '#000',
    '--affine-button-primary': 'hsl(240 5.9% 10%)',
  },
});

globalStyle('[data-theme="dark"]', {
  vars: {
    '--affine-brand-color': 'hsl(0 0% 98%)',
    '--affine-primary-color': 'hsl(0 0% 98%)',
    '--affine-toggle-circle-background-color': '#000',
    '--affine-pure-white': '#000',
    '--affine-active-shadow': 'rgba(0,0,0,.05)',
    '--affine-button-primary': 'hsl(0 0% 98%)',
    '--affine-button-pureWhiteText': 'hsl(240 5.9% 10%)',
  },
});
