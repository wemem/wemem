import type { AIItemGroupConfig } from '@blocksuite/blocks';

import { actionToHandler } from '../actions';
import { getAIPanel } from '../ai-panel';
import { AIProvider } from '../provider';
import {
  codeBlockShowWhen,
  edgelessHandler,
  textBlockShowWhen,
  translateSubItem,
} from './config';
import {
  AIMindMapIcon,
  AIPenIcon,
  AIPenIconWithAnimation,
  AIStarIconWithAnimation,
  ChatWithAIIcon,
  CommentIcon,
  ExplainIcon,
  LanguageIcon,
  SelectionIcon,
} from './icons';

export const ReadEaseAIItemGroups: AIItemGroupConfig[] = [
  {
    name: 'ask ai',
    items: [
      {
        name: 'Translate to',
        icon: LanguageIcon,
        showWhen: textBlockShowWhen,
        subItem: translateSubItem,
      },
      {
        name: 'Explain this code',
        icon: ExplainIcon,
        showWhen: codeBlockShowWhen,
        handler: actionToHandler('explainCode', AIStarIconWithAnimation),
      },
      {
        name: 'Explain selection',
        icon: SelectionIcon,
        showWhen: textBlockShowWhen,
        handler: actionToHandler('explain', AIStarIconWithAnimation),
      },
      {
        name: 'Summarize',
        icon: AIPenIcon,
        showWhen: textBlockShowWhen,
        handler: actionToHandler('summary', AIPenIconWithAnimation),
      },
      {
        name: 'Brainstorm ideas with mind map',
        icon: AIMindMapIcon,
        showWhen: textBlockShowWhen,
        handler: edgelessHandler('brainstormMindmap', AIPenIconWithAnimation),
      },
      {
        name: 'Continue with AI',
        icon: CommentIcon,
        handler: host => {
          const panel = getAIPanel(host);
          AIProvider.slots.requestOpenWithChat.emit({ host, autoSelect: true });
          panel.hide();
        },
      },
      {
        name: 'Open AI Chat',
        icon: ChatWithAIIcon,
        handler: host => {
          const panel = getAIPanel(host);
          AIProvider.slots.requestOpenWithChat.emit({ host });
          panel.hide();
        },
      },
    ],
  },
];
