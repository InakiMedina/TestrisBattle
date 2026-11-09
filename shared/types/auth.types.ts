import type { IUserStats } from './user.types';

export type Role = 'admin' | 'usuario';

export interface IAuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  profilePicture: string;
  background: string;
  elo: number;
  league: string;
  stats: IUserStats;
}
