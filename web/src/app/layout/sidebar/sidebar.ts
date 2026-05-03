import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  menuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Użytkownicy', path: '/admin/users', icon: '👥' },
    { label: 'Katalog', path: '/catalog', icon: '📚' },
    { label: 'Wypożyczenia', path: '/loans', icon: '🔄' },
    { label: 'Kolejka', path: '/queue', icon: '⏳' },
    { label: 'Kary', path: '/fines', icon: '💰' },
    { label: 'Zamówienia', path: '/orders', icon: '📦' },
  ];
}
