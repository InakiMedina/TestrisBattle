import type { IAuthUser, IPublicBackground, Role } from '@shared/types/auth.types';

export type { IAuthUser, IPublicBackground, Role };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: IAuthUser;
}

export interface MeResponse {
  user: IAuthUser;
}
