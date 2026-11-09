import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { IAuthUser } from '@shared/types/auth.types';
import config from '../config/config';

export const SALT_ROUNDS = 10;

export interface StoredUser extends IAuthUser {
  hashPass: string;
}

// Mismos valores por defecto que el modelo de Mongoose (user.model.ts)
export function defaultProfile() {
  return {
    profilePicture: '',
    background: '',
    elo: 1000,
    league: 'Unranked',
    stats: {
      games_played: 0,
      highest_score_rank: 0,
      highest_score_solo: 0,
      lines_destroyed: 0,
      powers_used: 0,
    },
  };
}

// Almacén temporal en memoria, se reemplazará por MongoDB.
export const users: StoredUser[] = [
  {
    id: randomUUID(),
    username: 'admin',
    email: 'admin@tetris.test',
    hashPass: bcrypt.hashSync(config.seedAdminPassword, SALT_ROUNDS),
    role: 'admin',
    ...defaultProfile(),
  },
  {
    id: randomUUID(),
    username: 'jugador',
    email: 'jugador@tetris.test',
    hashPass: bcrypt.hashSync(config.seedUserPassword, SALT_ROUNDS),
    role: 'usuario',
    ...defaultProfile(),
  },
];

export function findById(id: string): StoredUser | undefined {
  return users.find((u) => u.id === id);
}

export function findByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email === normalized);
}

export function toPublicUser(user: StoredUser): IAuthUser {
  const { hashPass: _omit, ...publicUser } = user;
  return publicUser;
}