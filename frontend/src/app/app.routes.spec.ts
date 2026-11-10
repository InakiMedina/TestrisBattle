import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import type { Role } from './core/auth/auth.models';
import { AuthService } from './core/auth/auth.service';
import { routes } from './app.routes';
import { BackgroundHandler } from './services/background-handler';

describe('application route access', () => {
  const role = signal<Role | null>('admin');
  const authenticated = signal(true);
  const authMock = {
    role: role.asReadonly(),
    isAuthenticated: authenticated.asReadonly(),
    hasRole: (allowed: Role | readonly Role[]) => {
      const currentRole = role();
      return currentRole !== null &&
        (typeof allowed === 'string' ? allowed === currentRole : allowed.includes(currentRole));
    },
  };

  beforeEach(async () => {
    role.set('admin');
    authenticated.set(true);
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: authMock },
        { provide: BackgroundHandler, useValue: { changeBackground: () => undefined } },
      ],
    }).compileComponents();
  });

  it('redirects /admin to the admin users route', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin');

    expect(TestBed.inject(Router).url).toBe('/admin/users');
  });

  it('allows admins on admin routes and denies them player routes', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/users');
    expect(TestBed.inject(Router).url).toBe('/admin/users');

    await harness.navigateByUrl('/practice');
    expect(TestBed.inject(Router).url).toBe('/access-denied');
  });

  it('denies players on admin routes', async () => {
    role.set('usuario');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/users');

    expect(TestBed.inject(Router).url).toBe('/access-denied');
  });

  it('sends unauthenticated admin-route requests to login with a return URL', async () => {
    role.set(null);
    authenticated.set(false);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin/users');

    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fadmin%2Fusers');
  });

  it('redirects a logged-in admin away from the login page to admin users', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/login');

    expect(TestBed.inject(Router).url).toBe('/admin/users');
  });
});
