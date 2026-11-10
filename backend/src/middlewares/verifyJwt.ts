import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import config from '../config/config';
import { User } from '../models/user.model';
import type { AuthenticatedUser } from '../types/auth.types';
import { toPublicUser } from '../services/user.mapper';
import { HttpError } from '../types/httpError';

export default async function verifyJwt(req: Request, _res: Response, next: NextFunction) {
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

  if (
    typeof decoded === 'string' ||
    typeof decoded.id !== 'string' ||
    !Types.ObjectId.isValid(decoded.id)
  ) {
    return next(new HttpError(401, 'Sesión inválida'));
  }

  try {
    // El rol se toma de la base de datos, no del token, para que siempre esté actualizado.
    const stored = await User.findById(decoded.id);
    if (!stored) return next(new HttpError(401, 'Sesión inválida'));

    const user: AuthenticatedUser = toPublicUser(stored);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
  
}
