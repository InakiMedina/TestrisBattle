import type { NextFunction, Request, Response } from 'express';
import { authenticateToken } from '../services/token.service';
import { HttpError } from '../types/httpError';

export default async function verifyJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Debes iniciar sesión'));
  }

  try {
    req.user = await authenticateToken(header.slice(7));
    next();
  } catch (error) {
    next(error);
  }
}
