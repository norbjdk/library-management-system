import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  navItems = [
    { label: 'Katalog', path: '/catalog', icon: '📚' },
    { label: 'Wypożyczenia', path: '/loans', icon: '🔄' },
    { label: 'Kolejka', path: '/queue', icon: '⏳' },
    { label: 'Kary', path: '/fines', icon: '💰' },
    { label: 'Zamówienia', path: '/orders', icon: '📦' },
    { label: 'Powiadomienia', path: '/notifications', icon: '🔔' },
  ];
}
