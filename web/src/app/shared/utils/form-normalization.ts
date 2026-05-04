const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(value: string): string {
  return normalizeText(value).toLowerCase();
}

export function hasText(value: string): boolean {
  return normalizeText(value).length > 0;
}

export function isValidEmail(value: string): boolean {
  const normalizedValue = normalizeEmail(value);
  return normalizedValue.length > 0 && EMAIL_REGEX.test(normalizedValue);
}

export function normalizeDateInput(value: string): string {
  return value.trim();
}

export function isValidIsoDate(value: string): boolean {
  return ISO_DATE_REGEX.test(normalizeDateInput(value));
}

export function getTodayIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
