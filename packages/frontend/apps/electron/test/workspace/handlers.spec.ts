import path from 'node:path';

import { removeWithRetry } from '@affine-test/kit/utils/utils';
import fs from 'fs-extra';
import { v4 } from 'uuid';
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';

const tmpDir = path.join(__dirname, 'tmp');
const appDataPath = path.join(tmpDir, 'app-data');

vi.doMock('@affine/electron/helper/db/ensure-db', () => ({
  ensureSQLiteDB: async () => ({
    destroy: () => {},
  }),
}));

vi.doMock('@affine/electron/helper/main-rpc', () => ({
  mainRPC: {
    getPath: async () => appDataPath,
  },
}));

afterEach(async () => {
  await removeWithRetry(tmpDir);
});

afterAll(() => {
  vi.doUnmock('@affine/electron/helper/main-rpc');
});

describe('delete workspace', () => {
  test('deleteWorkspace', async () => {
    const { deleteWorkspace } = await import(
      '@affine/electron/helper/workspace/handlers'
    );
    const workspaceId = v4();
    const workspacePath = path.join(appDataPath, 'workspaces', workspaceId);
    await fs.ensureDir(workspacePath);
    await deleteWorkspace(workspaceId);
    expect(await fs.pathExists(workspacePath)).toBe(false);
    // removed workspace will be moved to deleted-workspaces
    expect(
      await fs.pathExists(
        path.join(appDataPath, 'deleted-workspaces', workspaceId)
      )
    ).toBe(true);
  });
});

describe('getWorkspaceMeta', () => {
  test('can get meta', async () => {
    const { getWorkspaceMeta } = await import(
      '@affine/electron/helper/workspace/meta'
    );
    const workspaceId = v4();
    const workspacePath = path.join(appDataPath, 'workspaces', workspaceId);
    const meta = {
      id: workspaceId,
    };
    await fs.ensureDir(workspacePath);
    await fs.writeJSON(path.join(workspacePath, 'meta.json'), meta);
    expect(await getWorkspaceMeta('workspace', workspaceId)).toEqual(meta);
  });

  test('can create meta if not exists', async () => {
    const { getWorkspaceMeta } = await import(
      '@affine/electron/helper/workspace/meta'
    );
    const workspaceId = v4();
    const workspacePath = path.join(appDataPath, 'workspaces', workspaceId);
    await fs.ensureDir(workspacePath);
    expect(await getWorkspaceMeta('workspace', workspaceId)).toEqual({
      id: workspaceId,
      mainDBPath: path.join(workspacePath, 'storage.db'),
      type: 'workspace',
    });
    expect(
      await fs.pathExists(path.join(workspacePath, 'meta.json'))
    ).toBeTruthy();
  });

  test('can migrate meta if db file is a link', async () => {
    const { getWorkspaceMeta } = await import(
      '@affine/electron/helper/workspace/meta'
    );
    const workspaceId = v4();
    const workspacePath = path.join(appDataPath, 'workspaces', workspaceId);
    await fs.ensureDir(workspacePath);
    const sourcePath = path.join(tmpDir, 'source.db');
    await fs.writeFile(sourcePath, 'test');

    await fs.ensureSymlink(sourcePath, path.join(workspacePath, 'storage.db'));

    expect(await getWorkspaceMeta('workspace', workspaceId)).toEqual({
      id: workspaceId,
      mainDBPath: path.join(workspacePath, 'storage.db'),
      type: 'workspace',
    });

    expect(
      await fs.pathExists(path.join(workspacePath, 'meta.json'))
    ).toBeTruthy();
  });
});

test('storeWorkspaceMeta', async () => {
  const { storeWorkspaceMeta } = await import(
    '@affine/electron/helper/workspace/handlers'
  );
  const workspaceId = v4();
  const workspacePath = path.join(appDataPath, 'workspaces', workspaceId);
  await fs.ensureDir(workspacePath);
  const meta = {
    id: workspaceId,
    mainDBPath: path.join(workspacePath, 'storage.db'),
    type: 'workspace',
  };
  await storeWorkspaceMeta(workspaceId, meta);
  expect(await fs.readJSON(path.join(workspacePath, 'meta.json'))).toEqual(
    meta
  );
});
