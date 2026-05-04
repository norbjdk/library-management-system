import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb';
import { LoanList } from './pages/loan-list/loan-list';

@Component({
  selector: 'app-loans',
  imports: [RouterLink, Breadcrumb, LoanList],
  templateUrl: './loans.html',
  styleUrl: './loans.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loans {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Panel', path: '/catalog' },
    { label: 'Wypożyczenia' },
  ];
}
