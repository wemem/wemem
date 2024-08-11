import { ToggleCollapseIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import { type ForwardedRef, forwardRef, type PropsWithChildren } from 'react';

import * as styles from './index.css';

export type CategoryDividerProps = PropsWithChildren<
  {
    label: string;
    className?: string;
    collapsed?: boolean;
    setCollapsed?: (collapsed: boolean) => void;
  } & {
    [key: `data-${string}`]: unknown;
  }
>;

export const CategoryDivider = forwardRef(
  (
    {
      label,
      children,
      className,
      collapsed,
      setCollapsed,
      ...otherProps
    }: CategoryDividerProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const collapsible = collapsed !== undefined;

    return (
      <div
        className={clsx([styles.root, className])}
        ref={ref}
        onClick={() => setCollapsed?.(!collapsed)}
        data-collapsed={collapsed}
        data-collapsible={collapsible}
        {...otherProps}
      >
        <div className={styles.label}>
          {label}
          {collapsible ? (
            <ToggleCollapseIcon
              width={16}
              height={16}
              data-testid="category-divider-collapse-button"
              className={styles.collapseIcon}
            />
          ) : null}
        </div>
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  }
);

CategoryDivider.displayName = 'CategoryDivider';
