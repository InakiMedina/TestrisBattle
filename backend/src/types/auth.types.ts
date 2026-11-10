import type { IAuthUser } from '@shared/types/auth.types';

export type AuthenticatedUser = IAuthUser;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}