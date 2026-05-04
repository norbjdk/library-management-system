import { expect, test } from '@playwright/test';
import {
  mockMe,
  readerUser,
  sampleAvailability,
  sampleBook,
  sampleCopies,
  seedSession,
  staffUser,
} from './fixtures';

test('allows a new reader to register from the login screen', async ({ page }) => {
  await page.route('**/api/auth/register/', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        user: readerUser,
        access_token: 'registered-access-token',
        refresh_token: 'registered-refresh-token',
      }),
    });
  });

  await page.route('**/api/catalog/books/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([sampleBook]),
    });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Rejestracja' }).click();
  await page.locator('label:has-text("Imię") + input').fill('Anna');
  await page.locator('label:has-text("Nazwisko") + input').fill('Czytelnik');
  await page.locator('label:has-text("Email") + input').fill('anna@library.com');
  await page.locator('label:has-text("Data urodzenia") + input').fill('1998-03-12');
  await page.locator('label:has-text("Hasło") + input').fill('secret123');
  await page.locator('label:has-text("Powtórz hasło") + input').fill('secret123');
  await page.getByRole('button', { name: 'Utwórz konto' }).click();

  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByText('Solaris')).toBeVisible();
});

test('shows book details and lets the reader create a reservation', async ({ page }) => {
  await seedSession(page, readerUser);
  await mockMe(page, readerUser);

  await page.route('**/api/catalog/books/1/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sampleBook),
    });
  });

  await page.route('**/api/catalog/books/1/availability/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sampleAvailability),
    });
  });

  await page.route('**/api/catalog/copies/?book=1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sampleCopies),
    });
  });

  await page.route('**/api/reservations/', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 101,
          user: 2,
          user_name: 'Anna Czytelnik',
          book: 1,
          book_title: 'Solaris',
          reservation_date: '2026-05-04',
          expiry_date: '2026-05-11',
          status: 'pending',
          queue_position: 2,
          estimated_ready_date: '2026-05-11',
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto('/catalog/1');

  await expect(page.getByRole('heading', { name: 'Solaris' })).toBeVisible();
  await expect(page.getByText('A1 / Sci-Fi / floor 1')).toBeVisible();
  await page.getByRole('button', { name: 'Dołącz do kolejki rezerwacji' }).click();
  await expect(page.getByText('Rezerwacja została zapisana w kolejce.')).toBeVisible();
});

test('loads the reader reservation queue and cancels a pending reservation', async ({ page }) => {
  await seedSession(page, readerUser);
  await mockMe(page, readerUser);

  let status: 'pending' | 'cancelled' = 'pending';

  await page.route('**/api/reservations/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 101,
          user: 2,
          user_name: 'Anna Czytelnik',
          book: 1,
          book_title: 'Solaris',
          reservation_date: '2026-05-04',
          expiry_date: '2026-05-11',
          status,
          queue_position: 2,
          estimated_ready_date: '2026-05-11',
        },
      ]),
    });
  });

  await page.route('**/api/reservations/101/cancel/', async (route) => {
    status = 'cancelled';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 101,
        user: 2,
        user_name: 'Anna Czytelnik',
        book: 1,
        book_title: 'Solaris',
        reservation_date: '2026-05-04',
        expiry_date: '2026-05-11',
        status: 'cancelled',
        queue_position: 0,
        estimated_ready_date: null,
      }),
    });
  });

  await page.goto('/queue');
  await expect(page.getByText('Solaris')).toBeVisible();
  await page.getByRole('button', { name: 'Anuluj' }).click();
  await expect(page.getByText('Anulowana')).toBeVisible();
});

test('renders the librarian dashboard from live API responses', async ({ page }) => {
  await seedSession(page, staffUser);
  await mockMe(page, staffUser);

  await page.route('**/api/catalog/books/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        sampleBook,
        { ...sampleBook, id: 2, title: 'Dzienniki gwiazdowe', ean: '9788308061493' },
      ]),
    });
  });

  await page.route('**/api/loans/?overdue=true', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 200,
          user: 2,
          user_name: 'Anna Czytelnik',
          copy: 12,
          book_id: 1,
          book_title: 'Solaris',
          loan_date: '2026-04-20',
          due_date: '2026-05-02',
          return_date: null,
          status: 'overdue',
          days_until_due: -2,
          overdue_days: 2,
          is_overdue: true,
        },
      ]),
    });
  });

  await page.route('**/api/loans/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 200,
          user: 2,
          user_name: 'Anna Czytelnik',
          copy: 12,
          book_id: 1,
          book_title: 'Solaris',
          loan_date: '2026-04-20',
          due_date: '2026-05-02',
          return_date: null,
          status: 'overdue',
          days_until_due: -2,
          overdue_days: 2,
          is_overdue: true,
        },
        {
          id: 201,
          user: 3,
          user_name: 'Jan Nowak',
          copy: 15,
          book_id: 2,
          book_title: 'Dzienniki gwiazdowe',
          loan_date: '2026-05-01',
          due_date: '2026-05-15',
          return_date: null,
          status: 'active',
          days_until_due: 10,
          overdue_days: 0,
          is_overdue: false,
        },
      ]),
    });
  });

  await page.route('**/api/readers/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        readerUser,
        {
          ...readerUser,
          id: 3,
          email: 'jan@library.com',
          first_name: 'Jan',
          last_name: 'Nowak',
          full_name: 'Jan Nowak',
        },
      ]),
    });
  });

  await page.route('**/api/orders/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 501,
          book: 1,
          book_title: 'Solaris',
          requested_by: 1,
          requested_by_name: 'Marta Bibliotekarz',
          quantity: 2,
          supplier: 'WL',
          status: 'draft',
          notes: '',
          requested_at: '2026-05-01T09:00:00Z',
          expected_delivery_date: '2026-05-12',
          age_days: 3,
        },
        {
          id: 502,
          book: 2,
          book_title: 'Dzienniki gwiazdowe',
          requested_by: 1,
          requested_by_name: 'Marta Bibliotekarz',
          quantity: 1,
          supplier: 'WL',
          status: 'received',
          notes: '',
          requested_at: '2026-04-15T09:00:00Z',
          expected_delivery_date: '2026-04-25',
          age_days: 19,
        },
      ]),
    });
  });

  await page.route('**/api/fines/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 900,
          user: 2,
          user_name: 'Anna Czytelnik',
          loan: 200,
          loan_summary: 'Solaris / loan #200',
          amount: '123.50',
          issue_date: '2026-05-03',
          paid: false,
          paid_date: null,
          remaining_amount: '123.50',
        },
      ]),
    });
  });

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Dashboard operacyjny' })).toBeVisible();
  await expect(page.getByText('Wszystkich książek')).toBeVisible();
  await expect(page.getByText('123.50')).toBeVisible();
  await expect(page.getByText('Anna Czytelnik')).toBeVisible();
  await expect(page.getByText('Dzienniki gwiazdowe')).toBeVisible();
});
