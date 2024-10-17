import path from 'node:path';

import type { apis } from '@affine/electron-api';
import { test } from '@affine-test/kit/electron';
import { getBlockSuiteEditorTitle } from '@affine-test/kit/utils/page-logic';
import {
  clickNewPageButton,
  clickSideBarCurrentWorkspaceBanner,
} from '@affine-test/kit/utils/sidebar';
import { expect } from '@playwright/test';
import fs from 'fs-extra';

declare global {
  interface Window {
    __apis: typeof apis;
  }
}

test('check workspace has a DB file', async ({ appInfo, workspace }) => {
  const w = await workspace.current();
  const dbPath = path.join(
    appInfo.sessionData,
    'workspaces',
    w.meta.id,
    'storage.db'
  );
  // check if db file exists
  expect(await fs.exists(dbPath)).toBe(true);
});

test('export then add', async ({ page, appInfo, workspace }) => {
  await clickNewPageButton(page);
  const w = await workspace.current();

  await getBlockSuiteEditorTitle(page).fill('test1');

  await page.getByTestId('slider-bar-workspace-setting-button').click();
  await expect(page.getByTestId('setting-modal')).toBeVisible();

  const originalId = w.meta.id;

  const newWorkspaceName = 'new-test-name';

  // goto workspace setting
  await page.getByTestId('workspace-list-item').click();
  const input = page.getByTestId('workspace-name-input');
  await expect(input).toBeVisible();

  // change workspace name
  await input.fill(newWorkspaceName);
  await page.getByTestId('save-workspace-name').click();
  await page.waitForSelector('text="Update workspace name success"');

  const tmpPath = path.join(appInfo.sessionData, w.meta.id + '-tmp.db');

  // export db file to tmp folder
  await page.evaluate(tmpPath => {
    return window.__apis?.dialog.setFakeDialogResult({
      filePath: tmpPath,
    });
  }, tmpPath);

  await page.getByTestId('export-affine-backup').click();
  await page.waitForSelector('text="Export success"');
  await page.waitForTimeout(1000);
  expect(await fs.exists(tmpPath)).toBe(true);

  await page.getByTestId('modal-close-button').click();

  // add workspace
  // we are reusing the same db file so that we don't need to maintain one
  // in the codebase
  await clickSideBarCurrentWorkspaceBanner(page);

  await page.evaluate(tmpPath => {
    return window.__apis?.dialog.setFakeDialogResult({
      filePath: tmpPath,
    });
  }, tmpPath);

  // load the db file
  await page.getByTestId('add-workspace').click();

  // should show "Added Successfully" dialog
  // await page.waitForSelector('text="Added Successfully"');
  // await page.getByTestId('create-workspace-continue-button').click();

  // sleep for a while to wait for the workspace to be added :D
  await page.waitForTimeout(2000);
  const newWorkspace = await workspace.current();
  expect(newWorkspace.meta.id).not.toBe(originalId);
  // check its name is correct
  await expect(page.getByTestId('workspace-name')).toHaveText(newWorkspaceName);

  // find button which has the title "test1"
  const test1PageButton = await page.waitForSelector(`text="test1"`);
  await test1PageButton.click();

  const title = page.locator('[data-block-is-title] >> text="test1"');
  await expect(title).toBeVisible();
});
