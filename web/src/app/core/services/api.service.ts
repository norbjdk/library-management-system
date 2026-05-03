import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from '../models/book';
import { Fine } from '../models/fine';
import { Loan } from '../models/loan';
import { Notification } from '../models/notification';
import { Order } from '../models/order';
import { PaginatedResponse } from '../models/pagination';
import { Reservation } from '../models/reservation';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private base = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // --- Books ---
    getBooks(params?: Record<string, string>): Observable<PaginatedResponse<Book>> {
        const httpParams = new HttpParams({ fromObject: params ?? {} });
        return this.http.get<PaginatedResponse<Book>>(`${this.base}/books/`, { params: httpParams });
    }

    getBook(id: number): Observable<Book> {
        return this.http.get<Book>(`${this.base}/books/${id}/`);
    }

    getBookAvailability(id: number): Observable<any> {
        return this.http.get(`${this.base}/books/${id}/availability/`);
    }

    // --- Loans ---
    getLoans(params?: Record<string, string>): Observable<PaginatedResponse<Loan>> {
        const httpParams = new HttpParams({ fromObject: params ?? {} });
        return this.http.get<PaginatedResponse<Loan>>(`${this.base}/loans/`, { params: httpParams });
    }

    getLoan(id: number): Observable<Loan> {
        return this.http.get<Loan>(`${this.base}/loans/${id}/`);
    }

    createLoan(data: Partial<Loan>): Observable<Loan> {
        return this.http.post<Loan>(`${this.base}/loans/`, data);
    }

    returnLoan(id: number): Observable<Loan> {
        return this.http.post<Loan>(`${this.base}/loans/${id}/return_loan/`, {});
    }

    // --- Reservations ---
    getReservations(params?: Record<string, string>): Observable<PaginatedResponse<Reservation>> {
        const httpParams = new HttpParams({ fromObject: params ?? {} });
        return this.http.get<PaginatedResponse<Reservation>>(`${this.base}/reservations/`, { params: httpParams });
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

    // --- Fines ---
    getFines(params?: Record<string, string>): Observable<PaginatedResponse<Fine>> {
        const httpParams = new HttpParams({ fromObject: params ?? {} });
        return this.http.get<PaginatedResponse<Fine>>(`${this.base}/fines/`, { params: httpParams });
    }

    settleFine(id: number): Observable<Fine> {
        return this.http.post<Fine>(`${this.base}/fines/${id}/settle/`, {});
    }

    // --- Notifications ---
    getNotifications(params?: Record<string, string>): Observable<PaginatedResponse<Notification>> {
        const httpParams = new HttpParams({ fromObject: params ?? {} });
        return this.http.get<PaginatedResponse<Notification>>(`${this.base}/notifications/`, { params: httpParams });
    }

    markNotificationRead(id: number): Observable<Notification> {
        return this.http.post<Notification>(`${this.base}/notifications/${id}/mark_read/`, {});
    }

    markAllNotificationsRead(): Observable<{ updated: number }> {
        return this.http.post<{ updated: number }>(`${this.base}/notifications/mark_all_read/`, {});
    }

    // --- Orders ---
    getOrders(params?: Record<string, string>): Observable<PaginatedResponse<Order>> {
        const httpParams = new HttpParams({ fromObject: params ?? {} });
        return this.http.get<PaginatedResponse<Order>>(`${this.base}/orders/`, { params: httpParams });
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
}
