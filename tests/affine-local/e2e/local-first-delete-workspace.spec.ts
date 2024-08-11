import { test } from '@affine-test/kit/playwright';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import { waitForEditorLoad } from '@affine-test/kit/utils/page-logic';
import {
  openSettingModal,
  openWorkspaceSettingPanel,
} from '@affine-test/kit/utils/setting';
import { clickSideBarCurrentWorkspaceBanner } from '@affine-test/kit/utils/sidebar';
import { expect } from '@playwright/test';

test('Create new workspace, then delete it', async ({ page, workspace }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickSideBarCurrentWorkspaceBanner(page);
  await page.getByTestId('new-workspace').click();
  await page
    .getByTestId('create-workspace-input')
    .pressSequentially('Test Workspace', { delay: 50 });
  const createButton = page.getByTestId('create-workspace-create-button');
  await createButton.click();
  await createButton.waitFor({ state: 'hidden' });

  await page.waitForSelector('[data-testid="workspace-name"]');
  expect(await page.getByTestId('workspace-name').textContent()).toBe(
    'Test Workspace'
  );
  await openSettingModal(page);
  await openWorkspaceSettingPanel(page, 'Test Workspace');
  await page.getByTestId('delete-workspace-button').click();
  await expect(
    page.locator('.affine-notification-center').first()
  ).not.toBeVisible();
  const workspaceNameDom = page.getByTestId('workspace-name');
  const currentWorkspaceName = (await workspaceNameDom.evaluate(
    node => node.textContent
  )) as string;
  expect(currentWorkspaceName).toBeDefined();
  await page
    .getByTestId('delete-workspace-input')
    .pressSequentially(currentWorkspaceName);
  const promise = page
    .locator('.affine-notification-center')
    .first()
    .waitFor({ state: 'attached' });
  await page.getByTestId('delete-workspace-confirm-button').click();
  await promise;
  await page.reload();
  await page.waitForSelector('[data-testid="workspace-name"]');
  await page.waitForTimeout(1000);
  expect(await page.getByTestId('workspace-name').textContent()).toBe(
    'Demo Workspace'
  );
  const currentWorkspace = await workspace.current();

  expect(currentWorkspace.meta.flavour).toContain('local');
});

test('Delete last workspace', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  const workspaceNameDom = page.getByTestId('workspace-name');
  const currentWorkspaceName = await workspaceNameDom.evaluate(
    node => node.textContent
  );
  await openSettingModal(page);
  await openWorkspaceSettingPanel(page, currentWorkspaceName as string);
  await page.getByTestId('delete-workspace-button').click();
  await page
    .getByTestId('delete-workspace-input')
    .pressSequentially(currentWorkspaceName as string);
  await page.getByTestId('delete-workspace-confirm-button').click();
  await openHomePage(page);
  await expect(page.getByTestId('new-workspace')).toBeVisible();
  await page.getByTestId('new-workspace').click();
  await page
    .locator('[data-testid="create-workspace-input"]')
    .pressSequentially('Test Workspace');
  await page.getByTestId('create-workspace-create-button').click();
  await page.waitForTimeout(1000);
  await page.waitForSelector('[data-testid="workspace-name"]');
  await expect(page.getByTestId('workspace-name')).toHaveText('Test Workspace');
});
