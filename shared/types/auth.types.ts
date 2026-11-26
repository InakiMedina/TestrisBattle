import type { IUserStats } from './user.types';

export type Role = 'admin' | 'usuario';

// Fondo personalizado tal como lo ve el cliente (sin la ruta interna de S3).
export interface IPublicBackground {
  id: string;
  createdAt: string;
}

export interface IAuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  profilePicture: string;
  background: string;
  customBackgrounds: IPublicBackground[];
  elo: number;
  league: string;
  stats: IUserStats;
}
