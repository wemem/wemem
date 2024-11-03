import { AffineSchemas } from '@blocksuite/blocks/schemas';
import { DocCollection, Schema } from '@blocksuite/store';
import { Body, Controller, Post } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import * as Y from 'yjs';

import { DocNotFound, SpaceAccessDenied, Throttle } from '../../fundamentals';
import { importMarkDown } from '../../wemem/import-markdown/root-block/widgets/linked-doc/import-doc/import-doc';
import { CurrentUser } from '../auth';
import { PgWorkspaceDocStorageAdapter } from '../doc';
import { DocStorageOptions } from '../doc/options';
import { Permission, PermissionService } from '../permission';
import { WorkspaceSyncAdapter } from './gateway';

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
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly permissions: PermissionService,
    private readonly workspace: PgWorkspaceDocStorageAdapter,
    private readonly options: DocStorageOptions
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
      throw new SpaceAccessDenied({ spaceId: workspaceId });
    }

    const adapter = new WorkspaceSyncAdapter(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      undefined,
      this.workspace,
      this.permissions
    );

    const workspaceDocRecord = await adapter.get(workspaceId, workspaceId);
    if (!workspaceDocRecord) {
      throw new DocNotFound({ spaceId: workspaceId, docId: workspaceId });
    }

    const workspaceDoc = await this.options.recoverDoc([
      workspaceDocRecord.bin,
    ]);
    // 监听更新事件
    workspaceDoc.on('update', update => {
      this.workspace
        .pushDocUpdates(
          workspaceId,
          workspaceId,
          [Buffer.from(update)],
          user.id
        )
        .then(timestamp => {
          this.server.to(adapter.room(workspaceId)).emit('server-updates', {
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
    const workspacePages = workspaceDoc
      .getMap('meta')
      .get('pages') as Y.Array<DocMeta>;
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

    // 添加子文档
    workspacePages.push([subDocMeta as unknown as DocMeta]);

    // 获取子文档
    const newDoc = docCollection.getDoc(docId);
    if (!newDoc?.blockCollection.spaceDoc) {
      throw new DocNotFound({ spaceId: workspaceId, docId: docId });
    }
    const subDocUpdate = Y.encodeStateAsUpdate(
      newDoc?.blockCollection.spaceDoc
    );

    // 推送子文档更新
    const timestamp = await this.workspace.pushDocUpdates(
      workspaceId,
      docId,
      [Buffer.from(subDocUpdate)],
      user.id
    );
    this.server.to(adapter.room(workspaceId)).emit('server-updates', {
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
