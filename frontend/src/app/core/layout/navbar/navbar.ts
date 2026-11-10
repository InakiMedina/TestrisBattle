import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';

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

  isMenuOpen = false;
  readonly brandTitle = computed(() => this.auth.role() === 'admin' ? 'Admin Tetris' : 'Tetris');

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
