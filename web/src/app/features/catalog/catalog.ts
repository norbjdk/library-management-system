import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb';
import { CatalogList } from './pages/catalog-list/catalog-list';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink, Breadcrumb, CatalogList],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog {
  breadcrumbItems: BreadcrumbItem[] = [{ label: 'Panel' }, { label: 'Katalog' }];
}
