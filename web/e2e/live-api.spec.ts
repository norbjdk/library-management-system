import { expect, test } from '@playwright/test';

const useLiveApi = process.env['E2E_LIVE_API'] === '1';

test.describe('live API integration', () => {
  test.skip(!useLiveApi, 'Set E2E_LIVE_API=1 to run this scenario against the real backend API.');

  test('registers a reader and loads the catalog from the live backend', async ({ page }) => {
    const uniqueEmail = `reader-${Date.now()}@example.com`;
    const registerResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/register/') && response.request().method() === 'POST',
    );
    const booksResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/catalog/books/') && response.request().method() === 'GET',
    );

    await page.goto('/login');
    await page.getByRole('button', { name: 'Rejestracja' }).click();
    await page.locator('label:has-text("Imię") + input').fill('Anna');
    await page.locator('label:has-text("Nazwisko") + input').fill('Integracja');
    await page.locator('label:has-text("Email") + input').fill(uniqueEmail);
    await page.locator('label:has-text("Data urodzenia") + input').fill('1998-03-12');
    await page.locator('label:has-text("Hasło") + input').fill('secret123');
    await page.locator('label:has-text("Powtórz hasło") + input').fill('secret123');
    await page.getByRole('button', { name: 'Utwórz konto' }).click();

    const registerResponse = await registerResponsePromise;
    expect(registerResponse.ok()).toBeTruthy();

    const booksResponse = await booksResponsePromise;
    expect(booksResponse.ok()).toBeTruthy();
    const catalogPayload = (await booksResponse.json()) as unknown;

    if (Array.isArray(catalogPayload)) {
      expect(Array.isArray(catalogPayload)).toBeTruthy();
    } else {
      expect(Array.isArray((catalogPayload as { results?: unknown[] }).results)).toBeTruthy();
    }

    await expect(page).toHaveURL(/\/catalog$/);
  });
});
