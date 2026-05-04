import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb';
import { OrderList } from './pages/order-list/order-list';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, Breadcrumb, OrderList],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Orders {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Panel', path: '/catalog' },
    { label: 'Zamówienia' },
  ];
}
