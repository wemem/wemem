import { displayFlex, styled } from '@affine/component';

// TODO(@CatsJuice): refactor this component
export const StyledEditorModeSwitch = styled('div')<{
  switchLeft: boolean;
  showAlone?: boolean;
}>(({ switchLeft, showAlone }) => {
  return {
    maxWidth: showAlone ? '40px' : '70px',
    gap: '8px',
    height: '32px',
    background: showAlone
      ? 'transparent'
      : 'var(--affine-background-secondary-color)',
    borderRadius: '8px',
    ...displayFlex('space-between', 'center'),
    padding: '4px 4px',
    position: 'relative',

    '::after': {
      content: '""',
      display: showAlone ? 'none' : 'block',
      width: '24px',
      height: '24px',
      background: 'var(--affine-background-primary-color)',
      boxShadow: 'var(--affine-shadow-1)',
      borderRadius: '4px',
      zIndex: 1,
      position: 'absolute',
      transform: `translateX(${switchLeft ? '0' : '32px'})`,
      transition: 'all .15s',
    },
  };
});

export const StyledSwitchItem = styled('button')<{
  active?: boolean;
  hide?: boolean;
  trash?: boolean;
}>(({ active = false, hide = false, trash = false }) => {
  return {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    WebkitAppRegion: 'no-drag',
    boxShadow: active ? 'var(--affine-shadow-1)' : 'none',
    color: active
      ? trash
        ? 'var(--affine-error-color)'
        : 'var(--affine-primary-color)'
      : 'var(--affine-icon-color)',
    display: hide ? 'none' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    fontSize: '20px',
    path: {
      stroke: 'currentColor',
    },
  };
});
