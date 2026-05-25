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
    { label: 'Panel', path: '/admin', icon: '📊', staffOnly: true },
    { label: 'Użytkownicy', path: '/admin/users', icon: '👥', adminOnly: true },
    { label: 'Książki', path: '/admin/books', icon: '🛠️', adminOnly: true },
    { label: 'Katalog', path: '/catalog', icon: '📚', staffOnly: false, public: true },
    { label: 'Kategorie', path: '/categories', icon: '🗂️', staffOnly: false, public: true },
    { label: 'Wypożyczenia', path: '/loans', icon: '🔄', staffOnly: false, public: false },
    { label: 'Kolejka', path: '/queue', icon: '⏳', staffOnly: false, public: false },
    { label: 'Kary', path: '/fines', icon: '💰', staffOnly: false, public: false },
    { label: 'Zamówienia', path: '/orders', icon: '📦', staffOnly: true },
    { label: 'Powiadomienia', path: '/notifications', icon: '🔔', staffOnly: false, public: false },
    { label: 'Profil', path: '/profile', icon: '🪪', staffOnly: false, public: false },
  ];

  menuItems = computed(() => {
    if (this.auth.isStaff()) {
      return this.allItems.filter((item) => !item.adminOnly || this.auth.isAdmin());
    }

    if (this.auth.isLoggedIn()) {
      return this.allItems.filter((item) => !item.staffOnly && !item.adminOnly);
    }

    return this.allItems.filter((item) => item.public);
  });

  isLoggedIn = computed(() => this.auth.isLoggedIn());

  constructor(private auth: AuthService) {}
}
