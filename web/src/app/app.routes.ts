import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { staffGuard } from './core/guards/staff.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'catalog',
        pathMatch: 'full',
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/catalog/pages/catalog-list/catalog-list').then((m) => m.CatalogList),
      },
      {
        path: 'catalog/:id',
        loadComponent: () =>
          import('./features/catalog/pages/book-detail/book-detail').then((m) => m.BookDetail),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/catalog/pages/category-browser/category-browser').then(
            (m) => m.CategoryBrowser,
          ),
      },
      {
        path: 'loans',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/loans/pages/loan-list/loan-list').then((m) => m.LoanList),
      },
      {
        path: 'loans/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/loans/pages/loan-detail/loan-detail').then((m) => m.LoanDetail),
      },
      {
        path: 'queue',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/queue/pages/queue-list/queue-list').then((m) => m.QueueList),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/pages/user-profile/user-profile').then(
            (m) => m.UserProfileComponent,
          ),
      },
      {
        path: 'fines',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/fines/pages/fines-list/fines-list').then((m) => m.FinesList),
      },
      {
        path: 'orders',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./features/orders/pages/order-list/order-list').then((m) => m.OrderList),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/notifications/pages/notifications-list/notifications-list').then(
            (m) => m.NotificationsList,
          ),
      },
      {
        path: 'admin',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./features/admin/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/pages/user-list/user-list').then((m) => m.UserList),
      },
      {
        path: 'admin/books',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/pages/book-management/book-management').then(
            (m) => m.BookManagement,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'catalog',
  },
];
