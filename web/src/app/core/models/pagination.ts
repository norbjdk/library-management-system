export const DEFAULT_PAGE_SIZE = 20;

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
