import { randomUUID } from 'node:crypto';

import { Boxed, Native2Y, Text } from '@blocksuite/store';
import { Controller, Get, Query } from '@nestjs/common';
import * as Y from 'yjs';
import { Array as YArray, Map as YMap } from 'yjs';

import { Throttle } from '../../../fundamentals';
import { Public } from '../../auth';
import { DocManager } from '../../doc';
import { DocID } from '../../utils/doc';
import { EventsGateway, Sync } from '../events/events.gateway';

interface DocMeta {
  id: string;
  title: string;
  tags: string[];
  createDate: number;
  updatedDate?: number;
}

@Throttle('strict')
@Controller('/api/sync')
export class SyncController {
  constructor(
    private readonly docManager: DocManager,
    private readonly eventsGateway: EventsGateway
  ) {}

  @Public()
  @Get('createDocument')
  async createDocument(@Query('workspaceId') workspaceId: string) {
    const workspace = await this.docManager.get(workspaceId, workspaceId);
    if (!workspace) {
      return {
        message: `workspace ${workspaceId} not found`,
      };
    }
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

    const meta = workspace.doc.getMap('meta');
    const pages = meta.get('pages') as Y.Array<DocMeta>;
    const subDocId = randomUUID();
    // 创建一个新的 YMap 来存储文档信息
    const subDocMeta = new Y.Map();
    subDocMeta.set('id', subDocId);
    subDocMeta.set('title', subDocId);
    subDocMeta.set('createDate', Date.now());
    subDocMeta.set('tags', new Y.Array());
    pages.push([subDocMeta as unknown as DocMeta]);

    const subDocSnapshot = {
      J1ycQckQxGxGtwf3mLMzw: {
        'sys:id': 'J1ycQckQxGxGtwf3mLMzw',
        'sys:flavour': 'affine:page',
        'sys:version': 2,
        'sys:children': ['VR4ZIa7cTyPvLoT9BYN4u', 'vvIjUforcgWLipWn4TIjq'],
        'prop:title': new Text(subDocId),
      },
      VR4ZIa7cTyPvLoT9BYN4u: {
        'sys:id': 'VR4ZIa7cTyPvLoT9BYN4u',
        'sys:flavour': 'affine:surface',
        'sys:version': 5,
        'sys:children': [],
        'prop:elements': {
          type: '$blocksuite:internal:native$',
          value: {},
        },
      },
      vvIjUforcgWLipWn4TIjq: {
        'sys:id': 'vvIjUforcgWLipWn4TIjq',
        'sys:flavour': 'affine:note',
        'sys:version': 1,
        'sys:children': ['-bPykG0d7shAbsRm6hNmM'],
        'prop:xywh': '[0,0,800,95]',
        'prop:background': '--affine-note-background-blue',
        'prop:index': 'a0',
        'prop:hidden': false,
        'prop:displayMode': 'both',
        'prop:edgeless': {
          style: {
            borderRadius: 0,
            borderSize: 4,
            borderStyle: 'none',
            shadowType: '--affine-note-shadow-sticker',
          },
        },
      },
      '-bPykG0d7shAbsRm6hNmM': {
        'sys:id': '-bPykG0d7shAbsRm6hNmM',
        'sys:flavour': 'affine:paragraph',
        'sys:version': 1,
        'sys:children': [],
        'prop:type': 'text',
        'prop:text': new Text('哈哈哈'),
      },
    };
    const subDoc = new Y.Doc();
    convertJsonToYDoc(subDoc, subDocSnapshot);
    console.log('subDoc', subDoc.toJSON());
    const subDocUpdate = Y.encodeStateAsUpdate(subDoc);
    console.log('subDocUpdate', subDocUpdate);
    this.docManager
      .batchPush(workspaceId, subDocId, [Buffer.from(subDocUpdate)])
      .then(timestamp => {
        this.eventsGateway.server.to(Sync(workspaceId)).emit('server-updates', {
          workspaceId,
          guid: subDocId,
          updates: [Buffer.from(subDocUpdate).toString('base64')],
          timestamp,
        });
      })
      .catch(e => {
        console.error('error', e);
      });
    return {
      id: subDocId,
    };
  }
}

const convertJsonToYDoc = (ydoc: Y.Doc, data: any) => {
  const ymap = ydoc.getMap('blocks');

  try {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const nestedMap = new Y.Map();
        Object.entries(value as Record<string, any>).forEach(
          ([nestedKey, nestedValue]) => {
            nestedMap.set(nestedKey, native2Y(nestedValue));
          }
        );
        ymap.set(key, nestedMap);
      } else {
        ymap.set(key, native2Y(value));
      }
    });
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
};

type TransformOptions = {
  deep?: boolean;
  transform?: (value: unknown, origin: unknown) => unknown;
};

export function native2Y<T>(
  value: T,
  { deep = true, transform = x => x }: TransformOptions = {}
): Native2Y<T> {
  if (value instanceof Boxed) {
    return value.yMap as Native2Y<T>;
  }
  if (value instanceof Text) {
    if (value.yText.doc) {
      return value.yText.clone() as Native2Y<T>;
    }
    return value.yText as Native2Y<T>;
  }
  if (Array.isArray(value)) {
    const yArray: YArray<unknown> = new YArray<unknown>();
    const result = value.map(item => {
      return deep ? native2Y(item, { deep, transform }) : item;
    });
    yArray.insert(0, result);

    return yArray as Native2Y<T>;
  }
  if (isPureObject(value)) {
    const yMap = new YMap<unknown>();
    Object.entries(value).forEach(([key, value]) => {
      yMap.set(key, deep ? native2Y(value, { deep, transform }) : value);
    });

    return yMap as Native2Y<T>;
  }

  if (typeof value === 'string') {
    // return new YText(value) as Native2Y<T>;
  }

  console.error('Unsupported type', value);

  return value as Native2Y<T>;
}

export function isPureObject(value: unknown): value is object {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Object]' &&
    [Object, undefined, null].some(x => x === value.constructor)
  );
}
