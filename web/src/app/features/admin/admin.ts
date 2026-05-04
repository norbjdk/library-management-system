import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb';
import { Dashboard } from './pages/dashboard/dashboard';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, Breadcrumb, Dashboard],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Panel', path: '/catalog' },
    { label: 'Administracja' },
  ];
}
