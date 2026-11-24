import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import config from '../config/config';
import { User } from '../models/user.model';
import type { AuthenticatedUser } from '../types/auth.types';
import { HttpError } from '../types/httpError';
import { toPublicUser } from './user.mapper';

// Verifica un JWT y devuelve el usuario actual de la base de datos.
// Lo usan el middleware HTTP (verifyJwt) y el handshake de Socket.IO,
// así ambos canales validan la sesión exactamente igual.
export async function authenticateToken(token: string): Promise<AuthenticatedUser> {
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    const expired = error instanceof jwt.TokenExpiredError;
    throw new HttpError(401, expired ? 'Tu sesión expiró' : 'Sesión inválida');
  }

  if (
    typeof decoded === 'string' ||
    typeof decoded.id !== 'string' ||
    !Types.ObjectId.isValid(decoded.id)
  ) {
    throw new HttpError(401, 'Sesión inválida');
  }

  // El rol se toma de la base de datos, no del token, para que siempre esté actualizado.
  const stored = await User.findById(decoded.id);
  if (!stored) throw new HttpError(401, 'Sesión inválida');

  return toPublicUser(stored);
}
