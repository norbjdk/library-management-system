import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb';
import { QueueList } from './pages/queue-list/queue-list';

@Component({
  selector: 'app-queue',
  imports: [RouterLink, Breadcrumb, QueueList],
  templateUrl: './queue.html',
  styleUrl: './queue.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Queue {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Panel', path: '/catalog' },
    { label: 'Kolejka rezerwacji' },
  ];
}
