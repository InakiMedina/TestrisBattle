import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.scss',
})
export class Forbidden {
  protected readonly auth = inject(AuthService);

  protected homeRoute(): string {
    if (!this.auth.isAuthenticated()) return '/login';
    return this.auth.role() === 'admin' ? '/admin/users' : '/practice';
  }
}
