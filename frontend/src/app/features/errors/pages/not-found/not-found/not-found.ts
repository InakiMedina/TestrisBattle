import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  protected readonly auth = inject(AuthService);

  protected homeRoute(): string {
    if (!this.auth.isAuthenticated()) return '/login';
    return this.auth.role() === 'admin' ? '/admin/users' : '/practice';
  }
}
