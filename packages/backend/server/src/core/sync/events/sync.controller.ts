import { AffineSchemas } from '@blocksuite/blocks/schemas';
import { DocCollection, Schema } from '@blocksuite/store';
import { Body, Controller, Post } from '@nestjs/common';
import { nanoid } from 'nanoid';
import * as Y from 'yjs';

import {
  DocNotFound,
  Throttle,
  WorkspaceAccessDenied,
} from '../../../fundamentals';
import { importMarkDown } from '../../../wemem/import-markdown/root-block/widgets/linked-doc/import-doc/import-doc';
import { CurrentUser } from '../../auth';
import { DocManager } from '../../doc';
import { DocID } from '../../utils/doc';
import { PermissionService } from '../../workspaces/permission';
import { Permission } from '../../workspaces/types';
import { EventsGateway, Sync } from '../events/events.gateway';

export const globalBlockSuiteSchema = new Schema();
globalBlockSuiteSchema.register(AffineSchemas);

interface DocMeta {
  id: string;
  title: string;
  tags: string[];
  createDate: number;
  updatedDate?: number;
}

class CreateDocumentContent {
  workspaceId!: string;
  markdownContent!: string;
  title!: string;
}

@Throttle('strict')
@Controller('/api/sync')
export class SyncController {
  constructor(
    private readonly docManager: DocManager,
    private readonly eventsGateway: EventsGateway,
    private readonly permissions: PermissionService
  ) {}

  @Post('createDocument')
  async createDocument(
    @Body() content: CreateDocumentContent,
    @CurrentUser() user: CurrentUser
  ) {
    const { workspaceId, title, markdownContent } = content;

    if (
      !(await this.permissions.isWorkspaceMember(
        workspaceId,
        user.id,
        Permission.Write
      ))
    ) {
      throw new WorkspaceAccessDenied({ workspaceId });
    }

    const workspace = await this.docManager.get(workspaceId, workspaceId);
    if (!workspace) {
      return {
        message: `workspace ${workspaceId} not found`,
      };
    }

    // 监听更新事件
    workspace.doc.on('update', update => {
      const docId = new DocID(workspaceId, workspaceId);
      this.docManager
        .batchPush(docId.workspace, docId.guid, [Buffer.from(update)])
        .then(timestamp => {
          this.eventsGateway.server
            .to(Sync(workspaceId))
            .emit('server-updates', {
              workspaceId,
              guid: workspaceId,
              updates: [Buffer.from(update).toString('base64')],
              timestamp,
            });
        })
        .catch(e => {
          console.error('error', e);
        });
    });

    // 获取文档信息
    const meta = workspace.doc.getMap('meta');
    const pages = meta.get('pages') as Y.Array<DocMeta>;
    const docCollection = new DocCollection({
      id: workspaceId,
      idGenerator: () => nanoid(21),
      schema: globalBlockSuiteSchema,
    });

    docCollection.meta.initialize();

    const docId = await importMarkDown(docCollection, markdownContent, title);

    if (!docId) {
      return {
        message: `create doc in workspace ${workspaceId} fail`,
      };
    }

    // 创建一个新的 YMap 来存储文档信息
    const subDocMeta = new Y.Map();
    subDocMeta.set('id', docId);
    subDocMeta.set('title', title);
    subDocMeta.set('createDate', Date.now());
    subDocMeta.set('tags', new Y.Array());
    pages.push([subDocMeta as unknown as DocMeta]);

    // 获取子文档
    const newDoc = docCollection.getDoc(docId);
    if (!newDoc?.blockCollection.spaceDoc) {
      throw new DocNotFound({ workspaceId, docId: docId });
    }
    const subDocUpdate = Y.encodeStateAsUpdate(
      newDoc?.blockCollection.spaceDoc
    );

    // 推送子文档更新
    const timestamp = await this.docManager.batchPush(workspaceId, docId, [
      Buffer.from(subDocUpdate),
    ]);
    this.eventsGateway.server.to(Sync(workspaceId)).emit('server-updates', {
      workspaceId,
      guid: docId,
      updates: [Buffer.from(subDocUpdate).toString('base64')],
      timestamp,
    });

    return {
      workspaceId,
      docId: docId,
    };
  }
}
