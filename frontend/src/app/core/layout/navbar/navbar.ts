import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Calendar, Gamepad2, User } from 'lucide-angular';

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

  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
