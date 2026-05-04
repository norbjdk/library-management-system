import type { Page } from '@playwright/test';

export const readerUser = {
  id: 2,
  email: 'anna@library.com',
  first_name: 'Anna',
  last_name: 'Czytelnik',
  full_name: 'Anna Czytelnik',
  birthdate: '1998-03-12',
  role: 'reader',
  is_staff: false,
  created_at: '2026-05-04T10:15:00Z',
  loan_count: 1,
  reservation_count: 1,
  fine_total: '12.50',
};

export const staffUser = {
  id: 1,
  email: 'marta@library.com',
  first_name: 'Marta',
  last_name: 'Bibliotekarz',
  full_name: 'Marta Bibliotekarz',
  birthdate: '1990-01-20',
  role: 'librarian',
  is_staff: true,
  created_at: '2026-05-04T10:15:00Z',
  loan_count: 0,
  reservation_count: 0,
  fine_total: '0.00',
};

export const sampleBook = {
  id: 1,
  title: 'Solaris',
  ean: '9788308061492',
  description: 'Klasyczna powieść science fiction o kontakcie z nieznanym.',
  publish_year: 1961,
  publisher: 1,
  publisher_name: 'Wydawnictwo Literackie',
  authors: [{ id: 1, first_name: 'Stanisław', last_name: 'Lem' }],
  categories: [{ id: 1, name: 'Science fiction' }],
  copies_count: 2,
  available_copies: 1,
  active_loans: 1,
  active_reservations: 2,
  estimated_wait_days: 7,
};

export const sampleAvailability = {
  book_id: 1,
  title: 'Solaris',
  total_copies: 2,
  available_copies: 1,
  active_loans: 1,
  active_reservations: 2,
  estimated_wait_days: 7,
  estimated_ready_date: '2026-05-11',
};

export const sampleCopies = [
  {
    id: 11,
    book: 1,
    book_title: 'Solaris',
    location: 1,
    location_label: 'A1 / Sci-Fi / floor 1',
    condition: 'good',
    available: true,
  },
  {
    id: 12,
    book: 1,
    book_title: 'Solaris',
    location: 2,
    location_label: 'A2 / Sci-Fi / floor 1',
    condition: 'worn',
    available: false,
  },
];

export async function seedSession(page: Page, user: Record<string, unknown>) {
  await page.addInitScript((sessionUser) => {
    window.localStorage.setItem('access_token', 'test-access-token');
    window.localStorage.setItem('refresh_token', 'test-refresh-token');
    window.localStorage.setItem('user', JSON.stringify(sessionUser));
  }, user);
}

export async function mockMe(page: Page, user: Record<string, unknown>) {
  await page.route('**/api/auth/me/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
}
