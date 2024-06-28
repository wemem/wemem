import type { BlockElement } from '@blocksuite/block-std';
import {
  AffineReference,
  type EmbedLinkedDocModel,
  type EmbedSyncedDocModel,
  type ImageBlockModel,
  type SurfaceRefBlockComponent,
  type SurfaceRefBlockModel,
} from '@blocksuite/blocks';
import type { BlockModel } from '@blocksuite/store';
import { type DocMode, Entity, LiveData } from '@toeverything/infra';
import type { TemplateResult } from 'lit';
import { firstValueFrom, map, race } from 'rxjs';

import { resolveLinkToDoc } from '../../navigation';
import type { WorkbenchService } from '../../workbench';

export type PeekViewTarget =
  | HTMLElement
  | BlockElement
  | AffineReference
  | HTMLAnchorElement
  | { docId: string; blockId?: string };

export interface DocPeekViewInfo {
  type: 'doc';
  docId: string;
  blockId?: string;
  mode?: DocMode;
  xywh?: `[${number},${number},${number},${number}]`;
}

export type ImagePeekViewInfo = {
  type: 'image';
  docId: string;
  blockId: string;
};

export type CustomTemplatePeekViewInfo = {
  type: 'template';
  template: TemplateResult;
};

export type ActivePeekView = {
  target: PeekViewTarget;
  info: DocPeekViewInfo | ImagePeekViewInfo | CustomTemplatePeekViewInfo;
};

const EMBED_DOC_FLAVOURS = [
  'affine:embed-linked-doc',
  'affine:embed-synced-doc',
];

const isEmbedDocModel = (
  blockModel: BlockModel
): blockModel is EmbedSyncedDocModel | EmbedLinkedDocModel => {
  return EMBED_DOC_FLAVOURS.includes(blockModel.flavour);
};

const isImageBlockModel = (
  blockModel: BlockModel
): blockModel is ImageBlockModel => {
  return blockModel.flavour === 'affine:image';
};

const isSurfaceRefModel = (
  blockModel: BlockModel
): blockModel is SurfaceRefBlockModel => {
  return blockModel.flavour === 'affine:surface-ref';
};

function resolvePeekInfoFromPeekTarget(
  peekTarget: PeekViewTarget,
  template?: TemplateResult
): ActivePeekView['info'] | undefined {
  if (template) {
    return {
      type: 'template',
      template,
    };
  }

  if (peekTarget instanceof AffineReference) {
    if (peekTarget.refMeta) {
      return {
        type: 'doc',
        docId: peekTarget.refMeta.id,
      };
    }
  } else if ('model' in peekTarget) {
    const blockModel = peekTarget.model;
    if (isEmbedDocModel(blockModel)) {
      return {
        type: 'doc',
        docId: blockModel.pageId,
      };
    } else if (isSurfaceRefModel(blockModel)) {
      const refModel = (peekTarget as SurfaceRefBlockComponent).referenceModel;
      // refModel can be null if the reference is invalid
      if (refModel) {
        const docId =
          'doc' in refModel ? refModel.doc.id : refModel.surface.doc.id;
        return {
          type: 'doc',
          docId,
          mode: 'edgeless',
          xywh: refModel.xywh,
        };
      }
    } else if (isImageBlockModel(blockModel)) {
      return {
        type: 'image',
        docId: blockModel.doc.id,
        blockId: blockModel.id,
      };
    }
  } else if (peekTarget instanceof HTMLAnchorElement) {
    const maybeDoc = resolveLinkToDoc(peekTarget.href);
    if (maybeDoc) {
      return {
        type: 'doc',
        docId: maybeDoc.docId,
        blockId: maybeDoc.blockId,
      };
    }
  } else if ('docId' in peekTarget) {
    return {
      type: 'doc',
      docId: peekTarget.docId,
      blockId: peekTarget.blockId,
    };
  }
  return;
}

export class PeekViewEntity extends Entity {
  private readonly _active$ = new LiveData<ActivePeekView | null>(null);
  private readonly _show$ = new LiveData<boolean>(false);

  constructor(private readonly workbenchService: WorkbenchService) {
    super();
  }

  active$ = this._active$.distinctUntilChanged();
  show$ = this._show$
    .map(show => show && this._active$.value !== null)
    .distinctUntilChanged();

  // return true if the peek view will be handled
  open = async (
    target: ActivePeekView['target'],
    template?: TemplateResult
  ) => {
    const resolvedInfo = resolvePeekInfoFromPeekTarget(target, template);
    if (!resolvedInfo) {
      return;
    }

    const active = this._active$.value;

    // if there is an active peek view and it is a doc peek view, we will navigate it first
    if (active?.info.type === 'doc' && this.show$.value) {
      // TODO(@pengx17): scroll to the viewing position?
      this.workbenchService.workbench.openPage(active.info.docId);
    }

    this._active$.next({ target, info: resolvedInfo });
    this._show$.next(true);
    return firstValueFrom(race(this._active$, this.show$).pipe(map(() => {})));
  };

  close = () => {
    this._show$.next(false);
  };
}
