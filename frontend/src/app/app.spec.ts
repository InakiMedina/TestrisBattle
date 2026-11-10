import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import type { Role } from './core/auth/auth.models';
import { AuthService } from './core/auth/auth.service';
import { App } from './app';

@Component({ template: '' })
class TestPage {}

describe('App', () => {
  beforeEach(async () => {
    const role = signal<Role | null>(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'login', component: TestPage },
          { path: 'signin', component: TestPage },
          { path: 'practice', component: TestPage },
        ]),
        { provide: AuthService, useValue: { role, isAuthenticated: () => false } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('hides the navbar on login and signup, regardless of role', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/login');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-navbar')).toBeNull();

    await router.navigateByUrl('/signin');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-navbar')).toBeNull();

    await router.navigateByUrl('/practice');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-navbar')).toBeTruthy();
  });
});
