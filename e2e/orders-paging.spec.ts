import { expect, test } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://localhost:3000';
const PASSWORD = 'password123';

test('пагінація та пошук у замовленнях', async ({ page, request }) => {
  const email = `pager-${Date.now()}@test.local`;
  const reg = await request.post(`${API}/auth/register`, { data: { email, password: PASSWORD } });
  const { accessToken } = await reg.json();

  const product = await (await request.get(`${API}/products/med-soniashnykovyi`)).json();
  const address = {
    customerPhone: '+380671234567',
    city: 'Київ',
    warehouse: 'Відділення №12',
  };

  // 22 orders: two pages at 20 per page. One of them has a name nobody else has.
  for (let i = 0; i < 22; i += 1) {
    await request.post(`${API}/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        items: [{ productId: product.id, qty: 1 }],
        customerName: i === 0 ? 'Соломія Голка' : `Покупець ${i}`,
        ...address,
      },
    });
  }

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Вхід' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(PASSWORD);
  await page.getByRole('button', { name: 'Увійти' }).click();

  await page.goto('/orders');
  await expect(page.getByText('Знайдено 22 · сторінка 1 з 2')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(20);

  await page.getByRole('button', { name: 'Далі' }).click();
  await expect(page.getByText('сторінка 2 з 2')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(2);

  await page.getByLabel('Пошук').fill('Соломія');
  await expect(page.getByText('Знайдено 1 · сторінка 1 з 1')).toBeVisible();

  await page.getByRole('button', { name: 'Скинути' }).click();
  await expect(page.getByText('Знайдено 22')).toBeVisible();
});
