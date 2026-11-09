import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { IAuthUser, Role } from '@shared/types/auth.types';
import config from '../config/config';

export const SALT_ROUNDS = 10;

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  hashPass: string;
  role: Role;
}

// Almacén temporal en memoria, se reemplazará por MongoDB.
export const users: StoredUser[] = [
  {
    id: randomUUID(),
    username: 'admin',
    email: 'admin@tetris.test',
    hashPass: bcrypt.hashSync(config.seedAdminPassword, SALT_ROUNDS),
    role: 'admin',
  },
  {
    id: randomUUID(),
    username: 'jugador',
    email: 'jugador@tetris.test',
    hashPass: bcrypt.hashSync(config.seedUserPassword, SALT_ROUNDS),
    role: 'usuario',
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
  return { id: user.id, username: user.username, email: user.email, role: user.role };
}