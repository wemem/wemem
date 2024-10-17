import { I18n } from '@affine/i18n';
import type {
  AIItemGroupConfig,
  DocMode,
  EdgelessCopilotWidget,
  EdgelessElementToolbarWidget,
  EdgelessRootBlockComponent,
} from '@blocksuite/affine/blocks';
import { EdgelessCopilotToolbarEntry } from '@blocksuite/affine/blocks';
import { noop } from '@blocksuite/affine/global/utils';
import { html } from 'lit';

import { getEdgelessAIActionGroups } from '../../_common/readease-ai-action-config';

noop(EdgelessCopilotToolbarEntry);

export function setupEdgelessCopilot(widget: EdgelessCopilotWidget) {
  widget.groups = getEdgelessAIActionGroups(I18n);
}

export function setupEdgelessElementToolbarAIEntry(
  widget: EdgelessElementToolbarWidget
) {
  widget.registerEntry({
    when: () => {
      return true;
    },
    render: (edgeless: EdgelessRootBlockComponent) => {
      const chain = edgeless.service.std.command.chain();
      const filteredGroups = getEdgelessAIActionGroups(I18n).reduce(
        (pre, group) => {
          const filtered = group.items.filter(item =>
            item.showWhen?.(chain, 'edgeless' as DocMode, edgeless.host)
          );

          if (filtered.length > 0) pre.push({ ...group, items: filtered });

          return pre;
        },
        [] as AIItemGroupConfig[]
      );

      if (filteredGroups.every(group => group.items.length === 0)) return null;

      return html`<edgeless-copilot-toolbar-entry
        .buttonText=${I18n['ai.wemem.ask-ai']()}
        .edgeless=${edgeless}
        .host=${edgeless.host}
        .groups=${getEdgelessAIActionGroups(I18n)}
      ></edgeless-copilot-toolbar-entry>`;
    },
  });
}
