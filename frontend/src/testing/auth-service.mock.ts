import { computed, signal } from '@angular/core';
import type { IAuthUser } from '../app/core/auth/auth.models';

// Usuario de prueba para las specs que dependen de la sesión.
export function createTestUser(overrides: Partial<IAuthUser> = {}): IAuthUser {
  return {
    id: '6650f1c2a1b2c3d4e5f60718',
    username: 'jugador',
    email: 'jugador@tetris.test',
    role: 'usuario',
    profilePicture: '',
    background: '',
    customBackgrounds: [],
    elo: 1234,
    league: 'Plata',
    stats: {
      games_played: 0,
      highest_score_rank: 0,
      highest_score_solo: 0,
      lines_destroyed: 0,
      powers_used: 0,
    },
    ...overrides,
  };
}

// Sustituto mínimo de AuthService: guarda el usuario en una señal.
export function createAuthServiceMock(user: IAuthUser | null = createTestUser()) {
  const state = signal<IAuthUser | null>(user);
  return {
    currentUser: state.asReadonly(),
    isAuthenticated: computed(() => state() !== null),
    token: () => 'test-token',
    updateCurrentUser: (next: IAuthUser) => state.set(next),
    setUser: (next: IAuthUser | null) => state.set(next),
  };
}

// jsdom no implementa URL.createObjectURL / revokeObjectURL.
export function stubObjectUrls(): { created: string[]; revoked: string[] } {
  const created: string[] = [];
  const revoked: string[] = [];
  let counter = 0;
  URL.createObjectURL = () => {
    const url = `blob:test/${++counter}`;
    created.push(url);
    return url;
  };
  URL.revokeObjectURL = (url: string) => {
    revoked.push(url);
  };
  return { created, revoked };
}
