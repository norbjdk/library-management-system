import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Author,
  Book,
  BookAvailability,
  Category,
  Copy,
  Location,
  Publisher,
} from '../models/book';
import { Fine } from '../models/fine';
import { Loan } from '../models/loan';
import { Notification } from '../models/notification';
import { Order } from '../models/order';
import { PaginatedResponse } from '../models/pagination';
import { Reservation } from '../models/reservation';
import { User, UserProfile } from '../models/user';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private normalizeCollection<T>(response: PaginatedResponse<T> | T[]): PaginatedResponse<T> {
    if (Array.isArray(response)) {
      return {
        count: response.length,
        next: null,
        previous: null,
        results: response,
      };
    }

    return response;
  }

  private buildParams(params?: Record<string, string>): HttpParams {
    return new HttpParams({ fromObject: params ?? {} });
  }

  getBooks(params?: Record<string, string>): Observable<PaginatedResponse<Book>> {
    return this.http
      .get<PaginatedResponse<Book> | Book[]>(`${this.base}/catalog/books/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.base}/catalog/books/${id}/`);
  }

  getAuthors(params?: Record<string, string>): Observable<PaginatedResponse<Author>> {
    return this.http
      .get<PaginatedResponse<Author> | Author[]>(`${this.base}/catalog/authors/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getPublishers(params?: Record<string, string>): Observable<PaginatedResponse<Publisher>> {
    return this.http
      .get<PaginatedResponse<Publisher> | Publisher[]>(`${this.base}/catalog/publishers/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getCategories(params?: Record<string, string>): Observable<PaginatedResponse<Category>> {
    return this.http
      .get<PaginatedResponse<Category> | Category[]>(`${this.base}/catalog/categories/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getLocations(params?: Record<string, string>): Observable<PaginatedResponse<Location>> {
    return this.http
      .get<PaginatedResponse<Location> | Location[]>(`${this.base}/catalog/locations/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getBookAvailability(id: number): Observable<BookAvailability> {
    return this.http.get<BookAvailability>(`${this.base}/catalog/books/${id}/availability/`);
  }

  getCopies(params?: Record<string, string>): Observable<PaginatedResponse<Copy>> {
    return this.http
      .get<PaginatedResponse<Copy> | Copy[]>(`${this.base}/catalog/copies/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getLoans(params?: Record<string, string>): Observable<PaginatedResponse<Loan>> {
    return this.http
      .get<PaginatedResponse<Loan> | Loan[]>(`${this.base}/loans/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getLoan(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.base}/loans/${id}/`);
  }

  createLoan(data: Partial<Loan>): Observable<Loan> {
    return this.http.post<Loan>(`${this.base}/loans/`, data);
  }

  borrowBook(bookId: number, dueDate?: string): Observable<Loan> {
    return this.http.post<Loan>(`${this.base}/loans/borrow-book/`, {
      book: bookId,
      due_date: dueDate,
    });
  }

  returnLoan(id: number): Observable<Loan> {
    return this.http.post<Loan>(`${this.base}/loans/${id}/return_loan/`, {});
  }

  extendLoan(id: number, extensionDays = 7): Observable<Loan> {
    return this.http.post<Loan>(`${this.base}/loans/${id}/extend/`, {
      extension_days: extensionDays,
    });
  }

  getReservations(params?: Record<string, string>): Observable<PaginatedResponse<Reservation>> {
    return this.http
      .get<PaginatedResponse<Reservation> | Reservation[]>(`${this.base}/reservations/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  createReservation(data: Partial<Reservation>): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations/`, data);
  }

  cancelReservation(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations/${id}/cancel/`, {});
  }

  fulfillReservation(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations/${id}/fulfill/`, {});
  }

  getFines(params?: Record<string, string>): Observable<PaginatedResponse<Fine>> {
    return this.http
      .get<PaginatedResponse<Fine> | Fine[]>(`${this.base}/fines/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  settleFine(id: number): Observable<Fine> {
    return this.http.post<Fine>(`${this.base}/fines/${id}/settle/`, {});
  }

  getNotifications(params?: Record<string, string>): Observable<PaginatedResponse<Notification>> {
    return this.http
      .get<PaginatedResponse<Notification> | Notification[]>(`${this.base}/notifications/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  markNotificationRead(id: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/notifications/${id}/mark_read/`, {});
  }

  markAllNotificationsRead(): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(`${this.base}/notifications/mark_all_read/`, {});
  }

  getOrders(params?: Record<string, string>): Observable<PaginatedResponse<Order>> {
    return this.http
      .get<PaginatedResponse<Order> | Order[]>(`${this.base}/orders/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  createOrder(data: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/`, data);
  }

  submitOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/${id}/submit/`, {});
  }

  receiveOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/${id}/receive/`, {});
  }

  cancelOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/${id}/cancel/`, {});
  }

  getReaders(params?: Record<string, string>): Observable<PaginatedResponse<User>> {
    return this.http
      .get<PaginatedResponse<User> | User[]>(`${this.base}/readers/`, {
        params: this.buildParams(params),
      })
      .pipe(map((response) => this.normalizeCollection(response)));
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/profile/`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.base}/profile/`, data);
  }
}
