import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
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

  fullName = computed(() => {
    const user = this.auth.user();
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  });

  role = computed(() => {
    const role = this.auth.role();
    const labels: Record<string, string> = {
      admin: 'Administrator',
      librarian: 'Bibliotekarz',
      reader: 'Czytelnik',
    };
    return role ? labels[role] ?? role : '';
  });

  constructor(private auth: AuthService) { }

  logout() {
    this.auth.logout();
  }
}
