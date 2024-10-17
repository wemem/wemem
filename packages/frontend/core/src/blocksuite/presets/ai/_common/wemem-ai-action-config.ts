import {
  type AIItemGroupConfig,
  MindmapElementModel,
  type ShapeElementModel,
} from '@blocksuite/affine/blocks';

import { actionToHandler } from '../actions';
import {
  actionToHandler as edgelessActionToHandler,
  mindmapChildShowWhen,
  mindmapRootShowWhen,
  noteBlockOrTextShowWhen,
  noteWithCodeBlockShowWen,
} from '../actions/edgeless-handler';
import { getAIPanel } from '../ai-panel';
import { translateSubItem as edgelessTranslateSubItem } from '../entries/edgeless/actions-config';
import { AIProvider } from '../provider';
import { mindMapToMarkdown } from '../utils/edgeless';
import { getCopilotSelectedElems } from '../utils/selection-utils';
import {
  codeBlockShowWhen,
  edgelessHandler,
  textBlockShowWhen,
  translateSubItem,
} from './config';
import {
  AIExpandMindMapIcon,
  AIMindMapIcon,
  AIMindMapIconWithAnimation,
  AIPenIcon,
  AIPenIconWithAnimation,
  AIStarIconWithAnimation,
  ChatWithAIIcon,
  CommentIcon,
  ExplainIcon,
  LanguageIcon,
  SelectionIcon,
} from './icons';

export const getDocAIActionGroups = (I18n: any): AIItemGroupConfig[] => {
  return [
    {
      name: I18n['ai.wemem.ask-ai'](),
      items: [
        {
          name: I18n['ai.wemem.ask-ai.explain-selection'](),
          icon: SelectionIcon,
          showWhen: textBlockShowWhen,
          handler: actionToHandler('explain', AIStarIconWithAnimation),
        },
        {
          name: I18n['ai.wemem.ask-ai.explain-this-code'](),
          icon: ExplainIcon,
          showWhen: codeBlockShowWhen,
          handler: actionToHandler('explainCode', AIStarIconWithAnimation),
        },
        {
          name: I18n['ai.wemem.ask-ai.summarize'](),
          icon: AIPenIcon,
          showWhen: textBlockShowWhen,
          handler: actionToHandler('summary', AIPenIconWithAnimation),
        },
        {
          name: I18n['ai.wemem.ask-ai.translate-to'](),
          icon: LanguageIcon,
          showWhen: textBlockShowWhen,
          subItem: translateSubItem,
        },
        {
          name: I18n['ai.wemem.ask-ai.brainstorm-ideas-with-mind-map'](),
          icon: AIMindMapIcon,
          showWhen: textBlockShowWhen,
          handler: edgelessHandler('brainstormMindmap', AIPenIconWithAnimation),
        },
        {
          name: I18n['ai.wemem.ask-ai.continue-with-ai'](),
          icon: CommentIcon,
          handler: host => {
            const panel = getAIPanel(host);
            AIProvider.slots.requestOpenWithChat.emit({
              host,
              autoSelect: true,
            });
            panel.hide();
          },
        },
        {
          name: I18n['ai.wemem.ask-ai.open-ai-chat'](),
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
};

export const getEdgelessAIActionGroups = (I18n: any): AIItemGroupConfig[] => {
  return [
    {
      name: I18n['ai.wemem.ask-ai.group-name'](),
      items: [
        {
          name: I18n['ai.wemem.ask-ai.explain-selection'](),
          icon: SelectionIcon,
          showWhen: noteBlockOrTextShowWhen,
          handler: edgelessActionToHandler('explain', AIStarIconWithAnimation),
        },
        {
          name: I18n['ai.wemem.ask-ai.explain-this-code'](),
          icon: ExplainIcon,
          showWhen: noteWithCodeBlockShowWen,
          handler: edgelessActionToHandler(
            'explainCode',
            AIStarIconWithAnimation
          ),
        },
        {
          name: I18n['ai.wemem.ask-ai.summarize'](),
          icon: AIPenIcon,
          showWhen: noteBlockOrTextShowWhen,
          handler: edgelessActionToHandler('summary', AIPenIconWithAnimation),
        },
        {
          name: I18n['ai.wemem.ask-ai.translate-to'](),
          icon: LanguageIcon,
          showWhen: noteBlockOrTextShowWhen,
          subItem: edgelessTranslateSubItem,
        },
        {
          name: I18n['ai.wemem.ask-ai.brainstorm-ideas-with-mind-map'](),
          icon: AIMindMapIcon,
          showWhen: noteBlockOrTextShowWhen,
          handler: edgelessActionToHandler(
            'brainstormMindmap',
            AIMindMapIconWithAnimation
          ),
        },
        {
          name: I18n['ai.wemem.ask-ai.regenerate-mind-map'](),
          icon: AIMindMapIcon,
          showWhen: mindmapRootShowWhen,
          handler: edgelessActionToHandler(
            'brainstormMindmap',
            AIMindMapIconWithAnimation,
            {
              regenerate: true,
            }
          ),
        },
        {
          name: I18n['ai.wemem.ask-ai.expand-from-this-mind-map-node'](),
          icon: AIExpandMindMapIcon,
          showWhen: mindmapChildShowWhen,
          handler: edgelessActionToHandler(
            'expandMindmap',
            AIMindMapIconWithAnimation,
            undefined,
            function (host) {
              const selected = getCopilotSelectedElems(host);
              const firstSelected = selected[0] as ShapeElementModel;
              const mindmap = firstSelected?.group;

              if (!(mindmap instanceof MindmapElementModel)) {
                return Promise.resolve({});
              }

              return Promise.resolve({
                input: firstSelected.text?.toString() ?? '',
                mindmap: mindMapToMarkdown(mindmap),
              });
            }
          ),
          beta: true,
        },
        {
          name: I18n['ai.wemem.ask-ai.continue-with-ai'](),
          icon: CommentIcon,
          handler: host => {
            const panel = getAIPanel(host);
            AIProvider.slots.requestOpenWithChat.emit({
              host,
              mode: 'edgeless',
              autoSelect: true,
            });
            panel.hide();
          },
        },
        {
          name: I18n['ai.wemem.ask-ai.open-ai-chat'](),
          icon: ChatWithAIIcon,
          handler: host => {
            const panel = getAIPanel(host);
            AIProvider.slots.requestOpenWithChat.emit({
              host,
              mode: 'edgeless',
            });
            panel.hide();
          },
        },
      ],
    },
  ];
};
