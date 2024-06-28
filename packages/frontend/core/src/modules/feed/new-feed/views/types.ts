import type { CommandCategory } from '@affine/core/commands';
import type { DocMode } from '@toeverything/infra';
import type { ReactNode } from 'react';

export interface CommandContext {
  docMode: DocMode | undefined;
}

// similar to AffineCommand, but for rendering into the UI
// it unifies all possible commands into a single type so that
// we can use a single render function to render all different commands
export interface CMDKCommand {
  id: string;
  label:
    | ReactNode
    | string
    | {
        title: string;
        subTitle?: string;
      };
  icon?: React.ReactNode;
  category: CommandCategory;
  keyBinding?: string | { binding: string };
  timestamp?: number;
  alwaysShow?: boolean;
  value?: string; // this is used for item filtering
  originalValue?: string; // some values may be transformed, this is the original value
  run: (e?: Event) => void | Promise<void>;
}
