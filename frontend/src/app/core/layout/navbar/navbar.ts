import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Trophy, Gamepad2, User } from 'lucide-angular';
import { RankGameButton } from './components/rank-game-button/rank-game-button';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink, 
    RouterLinkActive,
    LucideAngularModule,
    RankGameButton
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

  readonly TrophyIcon = Trophy;
  readonly GamepadIcon = Gamepad2;
  readonly UserIcon = User;

  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
