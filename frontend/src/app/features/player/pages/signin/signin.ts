import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { getFormErrorMessage } from '../../../../core/http/http-error.util';

type SigninField = 'name' | 'email' | 'password' | 'confirm' | 'accept';

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password === confirm ? null : { mismatch: true };
};

@Component({
  selector: 'app-signin',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required, Validators.minLength(8)]],
      accept: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected showError(field: SigninField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected onSubmit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    // El formulario usa "name" y el backend espera "username"
    this.auth.register({ username: name.trim(), email: email.trim(), password }).subscribe({
      next: () => {
        void this.router.navigate(['/practice']);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(getFormErrorMessage(error));
      },
    });
  }
}
