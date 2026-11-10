import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import type { Role } from '../../auth/auth.models';
import { AuthService } from '../../auth/auth.service';

import { Navbar } from './navbar';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  const role = signal<Role | null>(null);

  beforeEach(async () => {
    role.set(null);
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([]), { provide: AuthService, useValue: { role } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows Admin Tetris for an admin and Tetris for other roles', () => {
    role.set('admin');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brand').textContent.trim()).toBe('Admin Tetris');
    expect(fixture.nativeElement.querySelector('.brand').getAttribute('aria-label')).toBe('Admin Tetris');

    role.set('usuario');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brand').textContent.trim()).toBe('Tetris');
    expect(fixture.nativeElement.querySelector('.brand').getAttribute('aria-label')).toBe('Tetris');
  });

  it('keeps the player navigation links unchanged', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('.nav-item')) as HTMLAnchorElement[];

    expect(links.map((link) => link.textContent.trim())).toEqual([
      '1 vs 1',
      'Practicar',
      'Perfil',
      'Historial',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/versus',
      '/practice',
      '/profile',
      '/history',
    ]);
    expect(
      links.map((link) =>
        Array.from(link.querySelectorAll('img')).map((image) => image.getAttribute('src')),
      ),
    ).toEqual([
      ['/navbar/1vs1.png', '/navbar/1vs1-active.png'],
      ['/navbar/single.png', '/navbar/single-active.png'],
      ['/navbar/profile.png', '/navbar/profile-active.png'],
      ['/navbar/history.png', '/navbar/history-active.png'],
    ]);
  });

  it('renders admin navigation links for the admin role', () => {
    role.set('admin');
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.nav-item')) as HTMLAnchorElement[];

    expect(links.map((link) => link.textContent.trim())).toEqual(['Users', 'Game', 'Stats']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/admin/users',
      '/admin/game',
      '/admin/stats',
    ]);
    expect(
      links.map((link) =>
        Array.from(link.querySelectorAll('img')).map((image) => image.getAttribute('src')),
      ),
    ).toEqual([
      ['/navbar/profile.png', '/navbar/profile-active.png'],
      ['/navbar/1vs1.png', '/navbar/1vs1-active.png'],
      ['/navbar/history.png', '/navbar/history-active.png'],
    ]);
  });
});
