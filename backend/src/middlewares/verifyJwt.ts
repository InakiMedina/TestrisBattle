import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import config from '../config/config';
import { findById, toPublicUser } from '../services/user.store';
import { HttpError } from '../types/httpError';
import type { AuthenticatedUser } from '../types/auth.types';

export default function verifyJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Debes iniciar sesión'));
  }

  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(header.slice(7), config.jwtSecret);
  } catch (error) {
    const expired = error instanceof jwt.TokenExpiredError;
    return next(new HttpError(401, expired ? 'Tu sesión expiró' : 'Sesión inválida'));
  }

  if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
    return next(new HttpError(401, 'Sesión inválida'));
  }

  // El rol se toma del almacén, no del token, para que siempre esté actualizado.
  const stored = findById(decoded.id);
  if (!stored) return next(new HttpError(401, 'Sesión inválida'));

  const user: AuthenticatedUser = toPublicUser(stored);
  req.user = user;
  next();
}