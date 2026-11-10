// backend/src/middlewares/authorize.ts
import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@shared/types/auth.types';
import { HttpError } from '../types/httpError';

const FORBIDDEN = 'No tienes permiso para realizar esta acción';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Debes iniciar sesión'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, FORBIDDEN));
    next();
  };
}

export function requireSelfOrAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, 'Debes iniciar sesión'));
  if (req.user.role === 'admin' || req.user.id === String(req.params.id)) return next();
  next(new HttpError(403, FORBIDDEN));
}

export function requireSelf(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, 'Debes iniciar sesión'));
  if (req.user.id === String(req.params.id)) return next();
  next(new HttpError(403, FORBIDDEN));
}
