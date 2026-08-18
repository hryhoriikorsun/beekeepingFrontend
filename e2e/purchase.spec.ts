import { expect, test } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://localhost:3000';
const PASSWORD = 'password123';

const unique = () => `buyer-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.local`;

test.describe('Шлях покупця', () => {
  test('незнайома людина знаходить товар і оформлює замовлення', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Мед з власної пасіки' })).toBeVisible();

    await page.getByRole('heading', { name: 'Мед липовий' }).click();
    await expect(page).toHaveURL(/\/products\/med-lypovyi$/);

    // Retail price, because nobody is logged in yet.
    await expect(page.getByText('200,00', { exact: false }).first()).toBeVisible();

    await page.getByLabel(/Кількість/).fill('3');
    await expect(page.getByText(/Разом:\s*600,00/)).toBeVisible();

    await page.getByRole('button', { name: 'Додати в кошик' }).click();
    await expect(page.getByText('Додано до кошика')).toBeVisible();

    await page.getByRole('link', { name: /Кошик/ }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('link', { name: 'Мед липовий' })).toBeVisible();
    await expect(page.getByText(/Разом:\s*600,00/)).toBeVisible();

    // Checkout is gated: a guest is sent to log in and comes back.
    await page.getByRole('link', { name: 'Оформити замовлення' }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);

    const email = unique();
    await page.getByRole('link', { name: 'Зареєструватися' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(PASSWORD);
    await page.getByRole('button', { name: 'Зареєструватися' }).click();

    await page.goto('/checkout');
    await page.getByLabel('Отримувач').fill('Іван Петренко');
    await page.getByLabel('Телефон').fill('+380671234567');
    await page.getByLabel('Місто').fill('Київ');
    await page.getByLabel('Відділення Нової пошти').fill('Відділення №12');
    await page.getByRole('button', { name: 'Підтвердити замовлення' }).click();

    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: /Замовлення №\d+/ })).toBeVisible();
    await expect(page.getByText('Прийнято')).toBeVisible();
    await expect(page.getByText(/600,00/).first()).toBeVisible();

    // The cart is emptied only after the server accepted the order.
    await page.getByRole('link', { name: /Кошик/ }).click();
    await expect(page.getByText('Кошик порожній.')).toBeVisible();
  });

  test('гуртовий покупець бачить свою ціну на тій самій сторінці', async ({ page, request }) => {
    const email = unique();
    const registration = await request.post(`${API}/auth/register`, {
      data: { email, password: PASSWORD },
    });
    const { user } = await registration.json();

    // Same page, same URL - only the role differs. Granting it is an admin
    // act through the API, exactly as it will happen for a real dealer.
    const adminLogin = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@beekeeping.local', password: PASSWORD },
    });
    const { accessToken } = await adminLogin.json();

    const promoted = await request.patch(`${API}/admin/users/${user.id}/role`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { role: 'DEALER' },
    });
    expect(promoted.ok()).toBe(true);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Вхід' })).toBeVisible();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(PASSWORD);
    await page.getByRole('button', { name: 'Увійти' }).click();
    await expect(page.getByText('гуртовий покупець')).toBeVisible();

    await page.goto('/products/med-lypovyi');
    await expect(page.getByText(/Візьміть 20 л/)).toBeVisible();

    await page.getByLabel(/Кількість/).fill('20');
    // 20 x 100 wholesale, not 20 x 200 retail. The page never computed this:
    // it asked the API again with the new quantity and the dealer token.
    await expect(page.getByText(/Разом:\s*2\s?000,00/)).toBeVisible();
    await expect(page.getByText(/Гуртова ціна від 20 л/)).toBeVisible();
  });

  test('сесія переживає перезавантаження сторінки', async ({ page }) => {
    const email = unique();

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Реєстрація' })).toBeVisible();
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(PASSWORD);
    await page.getByRole('button', { name: 'Зареєструватися' }).click();
    await expect(page.getByText(email)).toBeVisible();

    // The access token is deliberately lost on reload; the httpOnly refresh
    // cookie must bring the session back without a second login.
    await page.reload();
    await expect(page.getByText(email)).toBeVisible();

    const header = page.getByRole('banner');
    await header.getByRole('button', { name: 'Вийти' }).click();
    await expect(header.getByRole('link', { name: 'Увійти' })).toBeVisible();

    // Logging out must survive a reload: the refresh cookie is revoked on
    // the server, not merely forgotten in the tab.
    await page.reload();
    await expect(header.getByRole('link', { name: 'Увійти' })).toBeVisible();
  });
});
