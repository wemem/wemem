import { test } from '@affine-test/kit/playwright';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import { waitForEditorLoad } from '@affine-test/kit/utils/page-logic';
import { expect } from '@playwright/test';

test('Collapse Sidebar', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await page
    .locator('[data-testid=app-sidebar-arrow-button-collapse][data-show=true]')
    .click();
  const sliderBarArea = page.getByTestId('app-sidebar');
  await sliderBarArea.hover();
  await page.mouse.move(300, 300);
  await page.waitForTimeout(5000);
  await expect(sliderBarArea).not.toBeInViewport();
});

test('Expand Sidebar', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await page
    .locator('[data-testid=app-sidebar-arrow-button-collapse][data-show=true]')
    .click();
  const sliderBarArea = page.getByTestId('sliderBar-inner');
  await sliderBarArea.hover();
  await page.mouse.move(300, 300);
  await page.waitForTimeout(5000);
  await expect(sliderBarArea).not.toBeInViewport();

  await page
    .locator('[data-testid=app-sidebar-arrow-button-expand][data-show=true]')
    .click();
  await expect(sliderBarArea).toBeInViewport();
});

test('Click resizer can close sidebar', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  const sliderBarArea = page.getByTestId('sliderBar-inner');
  await expect(sliderBarArea).toBeVisible();

  await page
    .getByTestId('app-sidebar-wrapper')
    .getByTestId('resize-handle')
    .click();
  await expect(sliderBarArea).not.toBeInViewport();
});

test('Drag resizer can resize sidebar', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  const sliderBarArea = page.getByTestId('sliderBar-inner');
  await expect(sliderBarArea).toBeVisible();

  const sliderResizer = page
    .getByTestId('app-sidebar-wrapper')
    .getByTestId('resize-handle');
  await sliderResizer.hover();
  await page.mouse.down();
  await page.mouse.move(400, 300, {
    steps: 10,
  });
  await page.mouse.up();
  const boundingBox = await page.getByTestId('app-sidebar').boundingBox();
  expect(boundingBox?.width).toBe(399);
});

test('Sidebar in between sm & md breakpoint', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  const sliderBarArea = page.getByTestId('sliderBar-inner');
  const sliderBarModalBackground = page.getByTestId('app-sidebar-float-mask');
  await expect(sliderBarArea).toBeInViewport();
  await expect(sliderBarModalBackground).not.toBeVisible();

  await page.setViewportSize({
    width: 768,
    height: 1024,
  });
  await expect(sliderBarModalBackground).toBeVisible();

  // click modal background can close sidebar
  await sliderBarModalBackground.click({
    force: true,
    position: { x: 600, y: 150 },
  });
  await expect(sliderBarArea).not.toBeInViewport();
});
