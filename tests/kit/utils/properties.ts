import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const getPropertyValueLocator = (page: Page, property: string) => {
  return page.locator(
    `[data-testid="page-property-row-name"]:has-text("${property}") + *`
  );
};

export const ensurePagePropertiesVisible = async (page: Page) => {
  if (
    await page
      .getByRole('button', {
        name: 'Add property',
      })
      .isVisible()
  ) {
    return;
  }
  await page.getByTestId('page-info-collapse').click();
};

export const clickPropertyValue = async (page: Page, property: string) => {
  await getPropertyValueLocator(page, property).click();
};

export const openTagsEditor = async (page: Page) => {
  await clickPropertyValue(page, 'tags');
  await expect(page.getByTestId('tags-editor-popup')).toBeVisible();
};

export const closeTagsEditor = async (page: Page) => {
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('tags-editor-popup')).not.toBeVisible();
};

export const clickTagFromSelector = async (page: Page, name: string) => {
  // assume that the tags editor is already open
  await page
    .locator(`[data-testid="tag-selector-item"][data-tag-value="${name}"]`)
    .click();
};

export const removeSelectedTag = async (page: Page, name: string) => {
  await page
    .locator(
      `[data-testid="tags-editor-popup"] [data-testid="inline-tags-list"] [data-tag-value="${name}"] [data-testid="remove-tag-button"]`
    )
    .click();
};

export const filterTags = async (page: Page, filter: string) => {
  await page
    .locator(
      '[data-testid="tags-editor-popup"] [data-testid="inline-tags-list"] input'
    )
    .fill(filter);
};

export const searchAndCreateTag = async (page: Page, name: string) => {
  await filterTags(page, name);
  await page
    .locator(
      '[data-testid="tags-editor-popup"] [data-testid="tag-selector-item"]:has-text("Create ")'
    )
    .click();
};

export const expectTagsVisible = async (page: Page, tags: string[]) => {
  const tagListPanel = page
    .getByTestId('page-property-row')
    .getByTestId('inline-tags-list');

  expect(await tagListPanel.locator('[data-tag-value]').count()).toBe(
    tags.length
  );

  for (const tag of tags) {
    await expect(
      tagListPanel.locator(`[data-tag-value="${tag}"]`)
    ).toBeVisible();
  }
};

export const clickAddPropertyButton = async (page: Page) => {
  await page
    .getByRole('button', {
      name: 'Add property',
    })
    .click();
};

export const addCustomProperty = async (
  page: Page,
  type: string,
  inSettings?: boolean
) => {
  await clickAddPropertyButton(page);
  if (!inSettings) {
    await expect(
      page.getByRole('heading', {
        name: 'Properties',
      })
    ).toBeVisible();
    await page
      .getByRole('menuitem', {
        name: 'Create property',
      })
      .click();
  }
  await expect(
    page.getByRole('heading', {
      name: 'Type',
    })
  ).toBeVisible();
  await page
    .getByRole('menuitem', {
      name: type,
    })
    .click();
  if (!inSettings) {
    await expect(
      page
        .getByRole('menuitem', {
          name: type,
        })
        .locator('.selected')
    ).toBeVisible();
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(500);
};

export const expectPropertyOrdering = async (
  page: Page,
  properties: string[]
) => {
  for (let i = 0; i < properties.length; i++) {
    await expect(
      page.locator(`[data-testid="page-property-row-name"])`).nth(i)
    ).toHaveText(properties[i]);
  }
};

export const openWorkspaceProperties = async (page: Page) => {
  await page.getByTestId('slider-bar-workspace-setting-button').click();
  await page
    .locator('[data-testid="workspace-list-item"] .setting-name')
    .click();
  await page.getByTestId('workspace-list-item-properties').click();
};

export const selectVisibilitySelector = async (
  page: Page,
  name: string,
  option: string
) => {
  await page
    .getByRole('menu')
    .locator(
      `[data-testid="page-properties-settings-menu-item"]:has-text("${name}")`
    )
    .getByRole('button')
    .click();

  await page
    .getByRole('menu')
    .last()
    .getByRole('menuitem', {
      name: option,
      exact: true,
    })
    .click();

  await page.waitForTimeout(500);

  await page.keyboard.press('Escape');

  await page.waitForTimeout(500);
};

export const changePropertyVisibility = async (
  page: Page,
  name: string,
  option: string
) => {
  await expect(page.getByTestId('page-info-show-more')).toBeVisible();
  await page.click('[data-testid="page-info-show-more"]');
  await expect(
    page.getByRole('heading', {
      name: 'customize properties',
    })
  ).toBeVisible();
  await selectVisibilitySelector(page, name, option);
};
