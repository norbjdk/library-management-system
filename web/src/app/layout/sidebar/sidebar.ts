import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  allItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊', staffOnly: true },
    { label: 'Użytkownicy', path: '/admin/users', icon: '👥', staffOnly: true },
    { label: 'Katalog', path: '/catalog', icon: '📚', staffOnly: false },
    { label: 'Wypożyczenia', path: '/loans', icon: '🔄', staffOnly: false },
    { label: 'Kolejka', path: '/queue', icon: '⏳', staffOnly: false },
    { label: 'Kary', path: '/fines', icon: '💰', staffOnly: false },
    { label: 'Zamówienia', path: '/orders', icon: '📦', staffOnly: true },
    { label: 'Powiadomienia', path: '/notifications', icon: '🔔', staffOnly: false },
    { label: 'Profil', path: '/profile', icon: '🪪', staffOnly: false },
  ];

  menuItems = computed(() =>
    this.auth.isStaff() ? this.allItems : this.allItems.filter((i) => !i.staffOnly),
  );

  fullName = computed(() => {
    const user = this.auth.user();
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  });

  roleLabel = computed(() => {
    const role = this.auth.role();
    const labels: Record<string, string> = {
      admin: 'Administrator',
      librarian: 'Bibliotekarz',
      reader: 'Czytelnik',
    };
    return role ? (labels[role] ?? role) : '';
  });

  constructor(private auth: AuthService) {}
}
