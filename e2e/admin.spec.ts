import { expect, test, type Page } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://localhost:3000';
const PASSWORD = 'password123';
const slug = () => `test-med-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/// Everything except the cart lives behind the burger, so the menu has to be
/// opened before the session or any destination can be checked.
async function openMenu(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: 'Меню' }).click();
  return page.getByRole('navigation', { name: 'Основне меню' });
}

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Вхід' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(PASSWORD);
  await page.getByRole('button', { name: 'Увійти' }).click();

  const menu = await openMenu(page);
  await expect(menu.getByText(email)).toBeVisible();
  await page.keyboard.press('Escape');
}

test.describe('Адмін', () => {
  test('бачить статистику', async ({ page }) => {
    await loginAs(page, 'admin@beekeeping.local');
    await (await openMenu(page)).getByRole('link', { name: 'Адмінка' }).click();

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

  test('видаляє товар лише після введення його назви', async ({ page }) => {
    const productSlug = slug();
    const title = `Мед ${productSlug}`;

    await loginAs(page, 'admin@beekeeping.local');
    await page.goto('/admin/products');
    await page.getByRole('button', { name: 'Додати товар' }).click();
    await page.getByLabel('Назва').fill(title);
    await page.getByLabel('Slug (адреса сторінки)').fill(productSlug);
    await page.getByLabel('Ціна, грн').fill('250');
    await page.getByRole('button', { name: 'Створити' }).click();

    await page.getByRole('link', { name: new RegExp(productSlug) }).click();
    await page.getByRole('button', { name: 'Видалити товар' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole('button', { name: 'Видалити' });

    // Nothing typed, then the wrong thing typed: the button stays out of reach.
    await expect(confirm).toBeDisabled();
    await dialog.getByRole('textbox').fill('Мед');
    await expect(confirm).toBeDisabled();

    await dialog.getByRole('button', { name: 'Відмінити' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.getByRole('button', { name: 'Видалити товар' }).click();
    await dialog.getByRole('textbox').fill(title);
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page).toHaveURL(/\/admin\/products$/);
    await expect(page.getByRole('link', { name: new RegExp(productSlug) })).toHaveCount(0);

    // Gone from the shop as well, not merely from the admin list.
    await page.goto(`/products/${productSlug}`);
    await expect(page.getByText('404')).toBeVisible();
  });

  test('обирає товару фото й прибирає його', async ({ page }) => {
    const productSlug = slug();
    const title = `Мед ${productSlug}`;

    await loginAs(page, 'admin@beekeeping.local');
    await page.goto('/admin/products');
    await page.getByRole('button', { name: 'Додати товар' }).click();
    await page.getByLabel('Назва').fill(title);
    await page.getByLabel('Slug (адреса сторінки)').fill(productSlug);
    await page.getByLabel('Ціна, грн').fill('250');
    // The radios are visually hidden; a person clicks the tile, and so does the test.
    await page.getByText('Мед гречаний', { exact: true }).click();
    await page.getByRole('button', { name: 'Створити' }).click();
    await expect(page.getByRole('link', { name: new RegExp(productSlug) })).toBeVisible();

    // A decoded image, not just a tag: the optimiser must really serve the file.
    await page.goto(`/products/${productSlug}`);
    const photo = page.getByRole('img', { name: `Фото: ${title}` });
    await expect(photo).toHaveAttribute('src', /med-hrechanyi\.webp/);
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);

    // Checked against the admin, not the shop: the shop page is cached for a
    // minute, and that is by design.
    await page.goto('/admin/products');
    await page.getByRole('link', { name: new RegExp(productSlug) }).click();
    await expect(page.getByLabel('Мед гречаний')).toBeChecked();
    await page.getByText('Без фото', { exact: true }).click();
    await page.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.getByText('Збережено.')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Без фото')).toBeChecked();
  });

  test('веде дошку замовлень і рухає статус', async ({ page, request }) => {
    // A real order from a real buyer: the board is worth nothing if it only
    // works on rows the test drew itself.
    const buyer = `board-${Date.now()}@test.local`;
    const registration = await request.post(`${API}/auth/register`, {
      data: { email: buyer, password: PASSWORD },
    });
    const { accessToken } = await registration.json();

    const catalogue = await request.get(`${API}/products`);
    const [product] = await catalogue.json();

    const placed = await request.post(`${API}/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        items: [{ productId: product.id, qty: 1 }],
        customerName: 'Дошка Тестова',
        customerPhone: '+380671234567',
        city: 'Київ',
        warehouse: 'Відділення №1',
        paymentMethod: 'COD',
      },
    });
    const order = await placed.json();

    await loginAs(page, 'admin@beekeeping.local');
    await page.goto('/admin/orders');

    const row = page.locator('details').filter({ hasText: `Замовлення №${order.number}` });
    await row.getByText(`Замовлення №${order.number}`).click();
    await expect(row.getByText('Дошка Тестова')).toBeVisible();

    // Every move asks first, and each question names its own consequence.
    await row.getByRole('button', { name: 'Оплачено' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('потрапить у виторг статистики');
    await dialog.getByRole('button', { name: 'Позначити оплаченим' }).click();

    // CREATED -> PAID is allowed; the row then offers only what PAID allows.
    await expect(row.getByRole('button', { name: 'Відправлено' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Очікує оплати' })).toHaveCount(0);

    // A terminal move asks first, and taking the question back changes nothing.
    await row.getByRole('button', { name: 'Скасовано' }).click();
    await expect(dialog).toContainText('Скасування незворотне');
    await dialog.getByRole('button', { name: 'Відмінити' }).click();
    await expect(dialog).toBeHidden();
    await expect(row.getByRole('button', { name: 'Відправлено' })).toBeVisible();

    // Going through with it is final: nothing leads out of CANCELLED.
    await row.getByRole('button', { name: 'Скасовано' }).click();
    await dialog.getByRole('button', { name: 'Скасувати замовлення' }).click();
    await expect(row.getByText('Кінцевий статус — далі рухати нікуди.')).toBeVisible();

    const filters = page.getByRole('group', { name: 'Фільтр за статусом' });
    await filters.getByRole('button', { name: /Виконано/ }).click();
    await expect(row).toHaveCount(0);
  });

  test('не може купувати: кошик і замовлення для нього закриті', async ({ page }) => {
    await loginAs(page, 'admin@beekeeping.local');

    // The header slot that carries the cart for a buyer carries the admin
    // section instead - there is nothing for an admin to put in a cart.
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Адмінка' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Кошик' })).toHaveCount(0);

    await page.goto('/products/med-lypovyi');
    await expect(page.getByRole('button', { name: 'Додати в кошик' })).toHaveCount(0);
    await expect(page.getByRole('tooltip')).toHaveText('Адміністратор не купує товар');

    // The API refuses an admin's order anyway; these pages say so up front
    // instead of showing the whole shop's orders as "мої".
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'Мої замовлення' })).toHaveCount(0);
    await expect(
      page.getByText('Ця сторінка для покупців. Адміністратор не купує товар.'),
    ).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Кошик' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'До адмінки' })).toBeVisible();
  });

  test('не пускає користувача до адмінки', async ({ page }) => {
    await loginAs(page, 'customer@beekeeping.local');
    await page.goto('/admin');
    await expect(page.getByText('Цей розділ лише для адміністратора.')).toBeVisible();
    await expect(page.getByText('Виторг', { exact: true })).toHaveCount(0);
  });
});
