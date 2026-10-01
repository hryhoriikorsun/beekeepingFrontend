import { expect, test } from '@playwright/test';

test.describe('Головна', () => {
  test('кнопка у відео веде до каталогу, а каталог видно ще до неї', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Літо в кожній ложці' })).toBeVisible();

    // The band stops short of the fold on purpose: the catalogue heading
    // peeking below it is the cue that there is more page.
    const catalogue = page.getByRole('region', { name: 'Що є на пасіці' });
    const firstProduct = catalogue.getByRole('heading', { level: 3 }).first();
    await expect(catalogue.getByRole('heading', { name: 'Що є на пасіці' })).toBeInViewport();
    await expect(firstProduct).not.toBeInViewport();

    await page.getByRole('link', { name: 'Обрати мед' }).click();
    await expect(firstProduct).toBeInViewport();
    await expect(catalogue).toBeFocused();
    // The cards' greeting hangs off this attribute, set as the scroll starts.
    await expect(catalogue).toHaveAttribute('data-greeting', '');
  });

  test('відео можна зупинити й увімкнути знову', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Зупинити відео' });
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Увімкнути відео' })).toBeVisible();
    await page.getByRole('button', { name: 'Увімкнути відео' }).click();
    await expect(toggle).toBeVisible();
  });

  test('хто просив менше руху, тому відео саме не грає', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Увімкнути відео' })).toBeVisible();
    await context.close();
  });
});
