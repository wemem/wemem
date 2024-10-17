import type {
  ChangeEvent,
  CompositionEventHandler,
  CSSProperties,
  ForwardedRef,
  InputHTMLAttributes,
  KeyboardEvent,
  KeyboardEventHandler,
} from 'react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { useAutoFocus, useAutoSelect } from '../../hooks';

export type RowInputProps = {
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: (ev: FocusEvent & { currentTarget: HTMLInputElement }) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  autoSelect?: boolean;
  type?: HTMLInputElement['type'];
  style?: CSSProperties;
  onEnter?: () => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'onBlur'>;

// RowInput component that is used in the selector layout for search input
// handles composition events and enter key press
export const RowInput = forwardRef<HTMLInputElement, RowInputProps>(
  function RowInput(
    {
      disabled,
      onChange: propsOnChange,
      className,
      style = {},
      onEnter,
      onKeyDown,
      onBlur,
      autoFocus,
      autoSelect,
      ...otherProps
    }: RowInputProps,
    upstreamRef: ForwardedRef<HTMLInputElement>
  ) {
    const [composing, setComposing] = useState(false);
    const focusRef = useAutoFocus<HTMLInputElement>(autoFocus);
    const selectRef = useAutoSelect<HTMLInputElement>(autoSelect);

    const inputRef = (el: HTMLInputElement | null) => {
      focusRef.current = el;
      selectRef.current = el;
      if (upstreamRef) {
        if (typeof upstreamRef === 'function') {
          upstreamRef(el);
        } else {
          upstreamRef.current = el;
        }
      }
    };

    // use native blur event to get event after unmount
    // don't use useLayoutEffect here, because the cleanup function will be called before unmount
    useEffect(() => {
      if (!onBlur) return;
      selectRef.current?.addEventListener('blur', onBlur as any);
      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        selectRef.current?.removeEventListener('blur', onBlur as any);
      };
    }, [onBlur, selectRef]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        propsOnChange?.(e.target.value);
      },
      [propsOnChange]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(e);
        if (e.key !== 'Enter' || composing) {
          return;
        }
        onEnter?.();
      },
      [onKeyDown, composing, onEnter]
    );

    const handleCompositionStart: CompositionEventHandler<HTMLInputElement> =
      useCallback(() => {
        setComposing(true);
      }, []);

    const handleCompositionEnd: CompositionEventHandler<HTMLInputElement> =
      useCallback(() => {
        setComposing(false);
      }, []);

    return (
      <input
        className={className}
        ref={inputRef}
        disabled={disabled}
        style={style}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        {...otherProps}
      />
    );
  }
);
