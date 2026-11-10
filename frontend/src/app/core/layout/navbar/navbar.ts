import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';

interface NavbarItem {
  label: string;
  route: string;
  defaultIcon: string;
  activeIcon: string;
}

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink, 
    RouterLinkActive,
    LucideAngularModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private readonly auth = inject(AuthService);

  private readonly playerNavigationItems: NavbarItem[] = [
    {
      label: '1 vs 1',
      route: '/versus',
      defaultIcon: '/navbar/1vs1.png',
      activeIcon: '/navbar/1vs1-active.png',
    },
    {
      label: 'Practicar',
      route: '/practice',
      defaultIcon: '/navbar/single.png',
      activeIcon: '/navbar/single-active.png',
    },
    {
      label: 'Perfil',
      route: '/profile',
      defaultIcon: '/navbar/profile.png',
      activeIcon: '/navbar/profile-active.png',
    },
    {
      label: 'Historial',
      route: '/history',
      defaultIcon: '/navbar/history.png',
      activeIcon: '/navbar/history-active.png',
    },
  ];

  private readonly adminNavigationItems: NavbarItem[] = [
    {
      label: 'Users',
      route: '/admin/users',
      defaultIcon: '/navbar/profile.png',
      activeIcon: '/navbar/profile-active.png',
    },
    {
      label: 'Game',
      route: '/admin/game',
      defaultIcon: '/navbar/1vs1.png',
      activeIcon: '/navbar/1vs1-active.png',
    },
    {
      label: 'Stats',
      route: '/admin/stats',
      defaultIcon: '/navbar/history.png',
      activeIcon: '/navbar/history-active.png',
    },
  ];

  readonly navigationItems = computed(() =>
    this.auth.role() === 'admin' ? this.adminNavigationItems : this.playerNavigationItems,
  );

  isMenuOpen = false;
  readonly brandTitle = computed(() => this.auth.role() === 'admin' ? 'Admin Tetris' : 'Tetris');
  readonly homeRoute = computed(() => {
    const role = this.auth.role();
    return role === 'admin' ? '/admin/users' : role === 'usuario' ? '/practice' : '/login';
  });

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
