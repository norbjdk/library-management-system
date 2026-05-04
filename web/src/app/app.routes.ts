import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { staffGuard } from './core/guards/staff.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
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
        path: 'loans',
        loadComponent: () =>
          import('./features/loans/pages/loan-list/loan-list').then((m) => m.LoanList),
      },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/queue/pages/queue-list/queue-list').then((m) => m.QueueList),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/user-profile/user-profile').then(
            (m) => m.UserProfileComponent,
          ),
      },
      {
        path: 'fines',
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
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./features/admin/pages/user-list/user-list').then((m) => m.UserList),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'catalog',
  },
];
