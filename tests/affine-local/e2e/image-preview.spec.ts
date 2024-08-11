/* eslint-disable unicorn/prefer-dom-node-dataset */
import fs from 'node:fs';

import { test } from '@affine-test/kit/playwright';
import { importImage } from '@affine-test/kit/utils/image';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import {
  clickNewPageButton,
  getBlockSuiteEditorTitle,
  waitForEditorLoad,
} from '@affine-test/kit/utils/page-logic';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

async function closeImagePreviewModal(page: Page) {
  await page.getByTestId('image-preview-close-button').first().click();
  await page.waitForTimeout(500);
}

test('image preview should be shown', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  const title = getBlockSuiteEditorTitle(page);
  await title.click();
  await page.keyboard.press('Enter');
  await importImage(page, 'http://localhost:8081/large-image.png');
  await page.locator('affine-page-image').first().dblclick();
  const locator = page.getByTestId('image-preview-modal');
  await expect(locator).toBeVisible();
  await closeImagePreviewModal(page);
  await expect(locator).not.toBeVisible();
});

test('image go left and right', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
    await closeImagePreviewModal(page);
  }
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/affine-preview.png');
  }
  const locator = page.getByTestId('image-preview-modal');
  await expect(locator).toBeHidden();
  await page.locator('affine-page-image').first().dblclick();
  await page.waitForTimeout(1000);
  {
    const newBlobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).not.toBe(blobId);
  }
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);
  {
    const newBlobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).toBe(blobId);
  }
});

test('image able to zoom in and out with mouse scroll', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-content');
  const naturalWidth = await locator.evaluate(
    (img: HTMLImageElement) => img.naturalWidth
  );
  await expect(locator).toBeVisible();
  const { width, height } = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  // zoom in
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.wheel(0, 100);
  await page.mouse.wheel(0, 100);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(1000);
  let imageBoundary = await locator.boundingBox();
  let imageWidth = imageBoundary?.width;
  if (imageWidth) {
    expect((imageWidth / naturalWidth).toFixed(2)).toBe('0.54');
  }

  // zoom in
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(1000);
  imageBoundary = await locator.boundingBox();
  imageWidth = imageBoundary?.width;
  if (imageWidth) {
    expect((imageWidth / naturalWidth).toFixed(2)).toBe('0.84');
  }
});

test('image able to zoom in and out with button click', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-content');
  await expect(locator).toBeVisible();
  const naturalWidth = await locator.evaluate(
    (img: HTMLImageElement) => img.naturalWidth
  );

  await page.waitForTimeout(500);
  // zoom in
  {
    const locator = page.getByTestId('image-preview-modal');
    await locator.getByTestId('zoom-in-button').dblclick();
  }
  await page.waitForTimeout(1000);
  let imageBoundary = await locator.boundingBox();
  let imageWidth = imageBoundary?.width;
  if (imageWidth) {
    expect((imageWidth / naturalWidth).toFixed(2)).toBe('1.04');
  }

  // zooom out
  await page.getByTestId('zoom-out-button').dblclick();
  imageBoundary = await locator.boundingBox();
  imageWidth = imageBoundary?.width;
  if (imageWidth) {
    expect((imageWidth / naturalWidth).toFixed(2)).toBe('0.84');
  }
});

test('image should able to go left and right by buttons', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
    await closeImagePreviewModal(page);
  }
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/affine-preview.png');
  }
  const locator = page.getByTestId('image-preview-modal');
  await page.locator('affine-page-image').first().dblclick();
  await expect(locator).toBeVisible();
  {
    const newBlobId = (await locator
      .getByTestId('image-content')
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).not.toBe(blobId);
  }
  await locator.getByTestId('next-image-button').click();
  await page.waitForTimeout(1000);
  {
    const newBlobId = (await page
      .getByTestId('image-content')
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).toBe(blobId);
  }
  await locator.getByTestId('previous-image-button').click();
  await page.waitForTimeout(1000);
  {
    const newBlobId = (await locator
      .getByTestId('image-content')
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).not.toBe(blobId);
  }
});

test('image able to fit to screen by button', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-content');
  await expect(locator).toBeVisible();
  const naturalWidth = await locator.evaluate(
    (img: HTMLImageElement) => img.naturalWidth
  );
  const [viewportWidth, viewportHeight] = await page.evaluate(() => {
    return [window.innerWidth, window.innerHeight];
  });

  // zooom in
  {
    const locator = page.getByTestId('image-preview-modal');
    await locator.getByTestId('zoom-in-button').dblclick();
  }
  await page.waitForTimeout(1000);
  let imageBoundary = await locator.boundingBox();
  let imageWidth = imageBoundary?.width;
  if (imageWidth) {
    expect((imageWidth / naturalWidth).toFixed(2)).toBe('1.04');
  } else {
    throw new Error("Image doesn't exist!");
  }

  //reset zoom
  {
    const locator = page.getByTestId('image-preview-modal');
    await locator.getByTestId('fit-to-screen-button').click();
  }
  imageBoundary = await locator.boundingBox();
  imageWidth = imageBoundary?.width;
  const imageHeight = imageBoundary?.height;
  if (imageWidth && imageHeight) {
    expect(imageWidth).toBeLessThan(viewportWidth);
    expect(imageHeight).toBeLessThan(viewportHeight);
  } else {
    throw new Error("Image doesn't exist!");
  }
});

test('image able to reset zoom to 100%', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-content');
  await expect(locator).toBeVisible();
  const naturalWidth = await locator.evaluate(
    (img: HTMLImageElement) => img.naturalWidth
  );

  await page.waitForTimeout(500);
  // zoom in
  {
    const locator = page.getByTestId('image-preview-modal');
    await locator.getByTestId('zoom-in-button').dblclick();
  }
  await page.waitForTimeout(1000);
  let imageBoundary = await locator.boundingBox();
  let imageWidth = imageBoundary?.width;
  if (imageWidth) {
    expect((imageWidth / naturalWidth).toFixed(2)).toBe('1.04');
  } else {
    throw new Error("Image doesn't exist!");
  }

  //reset zoom
  {
    const locator = page.getByTestId('image-preview-modal');
    await locator.getByTestId('reset-scale-button').click();
  }
  imageBoundary = await locator.boundingBox();
  imageWidth = imageBoundary?.width;
  if (imageWidth) {
    expect((imageWidth / naturalWidth).toFixed(2)).toBe('1.00');
  } else {
    throw new Error("Image doesn't exist!");
  }
});

test('image able to copy to clipboard', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-preview-modal');
  await expect(locator).toBeVisible();
  await locator.getByTestId('copy-to-clipboard-button').click();
  await expect(
    page.locator('[data-testid=affine-toast]:has-text("Copied to clipboard.")')
  ).toBeVisible();
});

test('image able to download', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-preview-modal');
  await expect(locator).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await locator.getByTestId('download-button').click();
  const download = await downloadPromise;
  const name = download.suggestedFilename();
  await download.saveAs(`download/ + ${name}`);
  expect(fs.existsSync(`download/ + ${name}`)).toBeTruthy();
});

test('image should only able to move when image is larger than viewport', async ({
  page,
}) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-content');
  await expect(locator).toBeVisible();
  const { width, height } = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  let imageBoundary = await locator.boundingBox();
  const initialXPos = imageBoundary?.x;
  const initialYPos = imageBoundary?.y;
  // check will it be able to move when zoomed in
  {
    const locator = page.getByTestId('image-preview-modal');
    await locator.getByTestId('zoom-in-button').dblclick();
    await locator.getByTestId('zoom-in-button').dblclick();
  }
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.down();
  await page.mouse.move(20, 20);
  await page.mouse.up();
  imageBoundary = await locator.boundingBox();
  expect(initialXPos).not.toBe(imageBoundary?.x);
  expect(initialYPos).not.toBe(imageBoundary?.y);

  // check will it be able to move when zoomed out
  {
    const locator = page.getByTestId('image-preview-modal');
    await locator.getByTestId('fit-to-screen-button').click();
  }
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.down();
  await page.mouse.move(20, 20);
  await page.mouse.up();
  imageBoundary = await locator.boundingBox();
  expect(initialXPos).toBe(imageBoundary?.x);
  expect(initialYPos).toBe(imageBoundary?.y);
});

test('image should able to delete and when delete, it will move to previous/next image', async ({
  page,
}) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
    await closeImagePreviewModal(page);
  }
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/affine-preview.png');
  }
  const locator = page.getByTestId('image-preview-modal');
  await page.locator('affine-page-image').first().dblclick();
  await expect(locator).toBeVisible();
  // ensure the new image was imported
  await page.waitForTimeout(1000);
  {
    const newBlobId = (await locator
      .getByTestId('image-content')
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).not.toBe(blobId);
  }
  await page.waitForTimeout(500);
  await locator.getByTestId('delete-button').click();
  {
    const newBlobId = (await locator
      .getByTestId('image-content')
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).toBe(blobId);
    await closeImagePreviewModal(page);
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/affine-preview.png');
  }
  await page.locator('affine-page-image').first().dblclick();
  await locator.getByTestId('next-image-button').click();
  await page.waitForTimeout(1000);
  {
    const newBlobId = (await page
      .getByTestId('image-content')
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).toBe(blobId);
  }
  await locator.getByTestId('delete-button').click();
  {
    const newBlobId = (await locator
      .getByTestId('image-content')
      .getAttribute('data-blob-id')) as string;
    expect(newBlobId).not.toBe(blobId);
  }
  await locator.getByTestId('delete-button').click();
  await page.waitForTimeout(500);
  {
    const locator = await page.getByTestId('image-preview-modal').count();
    expect(locator).toBe(0);
  }
});

test('tooltips for all buttons should be visible when hovering', async ({
  page,
}) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  let blobId: string;
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().click();
    await page.keyboard.press('Enter');
    await importImage(page, 'http://localhost:8081/large-image.png');
    await page.locator('affine-page-image').first().dblclick();
    await page.waitForTimeout(500);
    blobId = (await page
      .getByTestId('image-preview-modal')
      .locator('img')
      .first()
      .getAttribute('data-blob-id')) as string;
    expect(blobId).toBeTruthy();
  }
  const locator = page.getByTestId('image-preview-modal');
  await page.waitForTimeout(500);
  await locator.getByTestId('previous-image-button').isDisabled();
  await page.waitForTimeout(1000);

  await locator.getByTestId('next-image-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const nextImageTooltip = await element.getByText('Next').count();
    expect(nextImageTooltip).toBe(1);
  }

  await locator.getByTestId('next-image-button').click();
  await locator.getByTestId('next-image-button').isDisabled();
  await page.waitForTimeout(1000);

  await locator.getByTestId('previous-image-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const previousImageTooltip = await element.getByText('Previous').count();
    expect(previousImageTooltip).toBe(1);
  }

  await locator.getByTestId('fit-to-screen-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const fitToScreenToolTip = await element.getByText('Fit to Screen').count();
    expect(fitToScreenToolTip).toBe(1);
  }

  await locator.getByTestId('zoom-out-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const zoomOutToolTip = await element.getByText('Zoom out').count();
    expect(zoomOutToolTip).toBe(1);
  }

  await locator.getByTestId('reset-scale-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const resetScaleTooltip = await element.getByText('Reset Scale').count();
    expect(resetScaleTooltip).toBe(1);
  }

  await locator.getByTestId('zoom-in-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const zoominToolTip = await element.getByText('Zoom in').count();
    expect(zoominToolTip).toBe(1);
  }

  await locator.getByTestId('download-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const downloadTooltip = await element.getByText('Download').count();
    expect(downloadTooltip).toBe(1);
  }

  await locator.getByTestId('copy-to-clipboard-button').hover();
  await page.waitForTimeout(1000);
  {
    const element = page.getByRole('tooltip');
    const downloadTooltip = await element
      .getByText('Copy to clipboard')
      .count();
    expect(downloadTooltip).toBe(1);
  }

  await locator.getByTestId('delete-button').hover();
  await page.waitForTimeout(500);
  {
    const element = page.getByRole('tooltip');
    const downloadTooltip = await element.getByText('Delete').count();
    expect(downloadTooltip).toBe(1);
  }
});

test('keypress esc should close the modal', async ({ page }) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  const title = getBlockSuiteEditorTitle(page);
  await title.click();
  await page.keyboard.press('Enter');
  await importImage(page, 'http://localhost:8081/large-image.png');
  await page.locator('affine-page-image').first().dblclick();
  const locator = page.getByTestId('image-preview-modal');
  await expect(locator).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await expect(locator).toBeHidden();
});

test('when mouse moves outside, the modal should be closed', async ({
  page,
}) => {
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  const title = getBlockSuiteEditorTitle(page);
  await title.click();
  await page.keyboard.press('Enter');
  await importImage(page, 'http://localhost:8081/large-image.png');
  await page.locator('affine-page-image').first().dblclick();
  const locator = page.getByTestId('image-preview-modal');
  await expect(locator).toBeVisible();
  // animation delay
  await page.waitForTimeout(1000);
  await page.mouse.click(10, 10);
  await page.waitForTimeout(1000);
  await expect(locator).not.toBeVisible();
});

test('caption should be visible and different styles were applied if image zoomed larger than viewport', async ({
  page,
}) => {
  const sampleCaption = 'affine owns me and all';
  await openHomePage(page);
  await waitForEditorLoad(page);
  await clickNewPageButton(page);
  const title = getBlockSuiteEditorTitle(page);
  await title.click();
  await page.keyboard.press('Enter');
  await importImage(page, 'http://localhost:8081/large-image.png');
  await page.locator('affine-page-image').first().hover();
  await page
    .locator('.affine-image-toolbar-container .image-toolbar-button.caption')
    .click();
  await page.getByPlaceholder('Write a caption').fill(sampleCaption);
  await page.locator('affine-page-image').first().dblclick();
  const locator = page.getByTestId('image-preview-modal');
  await expect(locator).toBeVisible();
  await page.waitForTimeout(1000);
  let captionLocator = locator.getByTestId('image-caption-zoomedout');
  await expect(captionLocator).toBeVisible();
  expect(await captionLocator.innerText()).toBe(sampleCaption);
  await page.getByTestId('zoom-in-button').click({ clickCount: 4 });
  await expect(captionLocator).not.toBeVisible();
  captionLocator = locator.getByTestId('image-caption-zoomedin');
  await expect(captionLocator).toBeVisible();
  expect(await captionLocator.innerText()).toBe(sampleCaption);
});
