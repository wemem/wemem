import { clickEdgelessModeButton } from '@affine-test/kit/utils/editor';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import {
  clickNewPageButton,
  getBlockSuiteEditorTitle,
  waitForEmptyEditor,
} from '@affine-test/kit/utils/page-logic';
import test, { expect } from '@playwright/test';

test('should be able to undo on empty page', async ({ page }) => {
  await openHomePage(page);
  await clickNewPageButton(page);
  await getBlockSuiteEditorTitle(page).isVisible();
  await waitForEmptyEditor(page);
  await clickEdgelessModeButton(page);
  await page.keyboard.press('ControlOrMeta+Z');

  // test editor still work
  await page.locator('affine-note').click({ force: true });
  await page.locator('affine-note').click({ force: true });
  await page.locator('affine-note').pressSequentially('test text');
  await expect(page.locator('affine-note')).toContainText('test text');
});
