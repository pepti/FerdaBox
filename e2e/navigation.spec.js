const { test, expect } = require('@playwright/test');

test.describe('Navigation — basic page loads', () => {

  test('homepage shows hero text: Ferða Box', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lol-hero__title')).toContainText('Ferða');
    await expect(page.locator('.lol-hero__title')).toContainText('Box');
  });

  test('homepage has a video background element', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('video.lol-hero__bg')).toBeAttached();
  });

  test('Projects page loads and shows project cards', async ({ page }) => {
    await page.goto('/#/projects');
    await expect(page.locator('.project-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('project detail page loads for Titan Travel Box', async ({ page }) => {
    await page.goto('/#/projects');
    await page.waitForSelector('.project-card', { timeout: 10_000 });
    await page.getByRole('button', { name: /View product: Titan Travel Box/i }).click();
    await expect(page.locator('.pd-hero__title')).toContainText('Titan Travel Box');
  });

  test('project detail page shows gallery images', async ({ page }) => {
    await page.goto('/#/projects');
    await page.waitForSelector('.project-card', { timeout: 10_000 });
    await page.getByRole('button', { name: /View product: Titan Travel Box/i }).click();
    await expect(page.locator('.gallery-grid')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.gallery-grid__item').first()).toBeVisible();
  });

  test('Halli bio page loads', async ({ page }) => {
    await page.goto('/#/halli');
    await expect(page.locator('.halli-bio')).toBeVisible();
  });

  test('Contact section is reachable from the navbar', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-scroll="contact"]').click();
    await expect(page.locator('#contact')).toBeAttached();
  });

  test('no JavaScript errors on homepage', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    // Let async rendering settle
    await page.waitForTimeout(2_000);

    expect(errors, `Unexpected JS errors: ${errors.join(', ')}`).toHaveLength(0);
  });

});
