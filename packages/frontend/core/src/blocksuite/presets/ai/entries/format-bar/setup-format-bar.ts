import '../../_common/components/ask-ai-button';

import { I18n } from '@affine/i18n';
import {
  type AffineFormatBarWidget,
  toolbarDefaultConfig,
} from '@blocksuite/affine/blocks';
import { html, type TemplateResult } from 'lit';

import { getDocAIActionGroups } from '../../_common/readease-ai-action-config';

export function setupFormatBarAIEntry(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);
  formatBar.addRawConfigItems(
    [
      {
        type: 'custom' as const,
        render(formatBar: AffineFormatBarWidget): TemplateResult | null {
          return html` <ask-ai-button
            .buttonText=${I18n['ai.wemem.ask-ai']()}
            .host=${formatBar.host}
            .actionGroups=${getDocAIActionGroups(I18n)}
            .toggleType=${'hover'}
          ></ask-ai-button>`;
        },
      },
      { type: 'divider' },
    ],
    0
  );
}
