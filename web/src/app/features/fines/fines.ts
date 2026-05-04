import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb';
import { FinesList } from './pages/fines-list/fines-list';

@Component({
  selector: 'app-fines',
  imports: [RouterLink, Breadcrumb, FinesList],
  templateUrl: './fines.html',
  styleUrl: './fines.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Fines {
  breadcrumbItems: BreadcrumbItem[] = [{ label: 'Panel', path: '/catalog' }, { label: 'Kary' }];
}
