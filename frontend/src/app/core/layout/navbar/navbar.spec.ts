import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
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
      providers: [{ provide: AuthService, useValue: { role } }],
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
});
