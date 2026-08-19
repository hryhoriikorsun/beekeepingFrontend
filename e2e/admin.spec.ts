import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'password123';
const slug = () => `test-med-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Вхід' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(PASSWORD);
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page.getByText(email)).toBeVisible();
}

test.describe('Адмін', () => {
  test('бачить статистику', async ({ page }) => {
    await loginAs(page, 'admin@beekeeping.local');
    await page.getByRole('link', { name: 'Адмінка' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Виторг', { exact: true })).toBeVisible();
    await expect(page.getByText('Середній чек')).toBeVisible();
    await expect(page.getByText('Замовлення за статусами')).toBeVisible();
  });

  test('створює товар і задає незалежні пороги для користувача та курєра', async ({ page }) => {
    const productSlug = slug();
    // The title carries the run id too: leftovers from earlier runs live in
    // the same development database.
    const title = `Мед ${productSlug}`;

    await loginAs(page, 'admin@beekeeping.local');
    await page.goto('/admin/products');

    await page.getByRole('button', { name: 'Додати товар' }).click();
    await page.getByLabel('Назва').fill(title);
    await page.getByLabel('Slug (адреса сторінки)').fill(productSlug);
    await page.getByLabel('Ціна, грн').fill('300');
    await page.getByLabel('Залишок').fill('500');
    await page.getByRole('button', { name: 'Створити' }).click();

    await page.getByRole('link', { name: new RegExp(productSlug) }).click();
    await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);

    const customer = page.getByRole('region', { name: 'Користувач' });
    const courier = page.getByRole('region', { name: 'Курєр' });

    await customer.getByLabel(/від/).fill('5');
    await customer.getByLabel(/ціна/).fill('280');
    await customer.getByRole('button', { name: 'Додати' }).click();
    await expect(customer.getByText('від 5 л')).toBeVisible();

    await courier.getByLabel(/від/).fill('40');
    await courier.getByLabel(/ціна/).fill('150');
    await courier.getByRole('button', { name: 'Додати' }).click();
    await expect(courier.getByText('від 40 л')).toBeVisible();

    // The two ladders are separate: the courier threshold must not appear to
    // an ordinary buyer, and the shop price must follow the customer ladder.
    await page.goto(`/products/${productSlug}?`);
    const ladder = page.getByRole('table');
    await expect(ladder).toContainText('від 5 л');
    await expect(ladder).not.toContainText('від 40 л');

    await page.getByLabel(/Кількість/).fill('5');
    await expect(page.getByText(/Разом:\s*1\s?400,00/)).toBeVisible();
  });

  test('не пускає користувача до адмінки', async ({ page }) => {
    await loginAs(page, 'customer@beekeeping.local');
    await page.goto('/admin');
    await expect(page.getByText('Цей розділ лише для адміністратора.')).toBeVisible();
    await expect(page.getByText('Виторг', { exact: true })).toHaveCount(0);
  });
});
