import { ArrowDownSmallIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

import * as styles from './index.css';

interface CategoryDividerProps extends PropsWithChildren {
  label: string;
}

export function CategoryDivider({ label, children }: CategoryDividerProps) {
  return (
    <div className={clsx([styles.root])}>
      <div className={styles.label}>{label}</div>
      {children}
    </div>
  );
}

interface CollapsibleCategoryDividerProps extends CategoryDividerProps {
  label: string;
  onCollapsedChange: (collapsed: boolean) => void;
  collapsed: boolean;
}

export function CollapsibleCategoryDivider({
  label,
  children,
  onCollapsedChange,
  collapsed,
}: CollapsibleCategoryDividerProps) {
  const handleParentClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (e.target === e.currentTarget) {
      onCollapsedChange(!collapsed);
    }
  };

  // Handler for the inner icon click event
  const handleIconClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault(); // For links, preventing default action
    onCollapsedChange(!collapsed);
  };

  return (
    <div className={clsx([styles.collapsedRoot])} onClick={handleParentClick}>
      <div className={styles.label} onClick={handleParentClick}>
        {label}
        <div className={styles.iconsContainer} data-collapsible>
          <div
            data-disabled={collapsed === undefined ? true : undefined}
            onClick={handleIconClick}
            data-testid="fav-collapsed-button"
            className={styles.collapsedIconContainer}
          >
            <ArrowDownSmallIcon
              className={styles.collapsedIcon}
              data-collapsed={collapsed !== false}
            />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
