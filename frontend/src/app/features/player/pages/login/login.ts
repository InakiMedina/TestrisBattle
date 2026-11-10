import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { getFormErrorMessage } from '../../../../core/http/http-error.util';

type LoginField = 'email' | 'password';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected showError(field: LoginField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected onSubmit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ email: email.trim(), password }).subscribe({
      next: () => {
        void this.router.navigateByUrl(this.returnUrl());
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(getFormErrorMessage(error));
      },
    });
  }

  // Vuelve a la ruta que se pidió originalmente (la pone el guardia en ?returnUrl=).
  // Solo se aceptan rutas internas para evitar redirecciones a sitios externos.
  private returnUrl(): string {
    if (this.auth.role() === 'admin') return '/admin/users';

    const target = this.route.snapshot.queryParamMap.get('returnUrl');
    if (target && target.startsWith('/') && !target.startsWith('//')) {
      return target;
    }
    return '/practice';
  }
}
