import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { IAuthUser } from '@shared/types/auth.types';
import config from '../config/config';
import { User } from '../models/user.model';
import { HttpError } from '../types/httpError';
import { toPublicUser } from './user.mapper';
import * as userService from './user.services';

export interface AuthResult {
  token: string;
  user: IAuthUser;
}

function signToken(user: IAuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as StringValue },
  );
}

export async function login(email: string, password: string): Promise<AuthResult> {
  // hashPass tiene select:false, por eso se pide explícitamente
  const stored = await User.findOne({ email: email.trim().toLowerCase() }).select('+hashPass');
  const valid = stored ? await bcrypt.compare(password, stored.hashPass) : false;
  if (!stored || !valid) throw new HttpError(401, 'Credenciales inválidas');

  const user = toPublicUser(stored);
  return { token: signToken(user), user };
}

export async function register(input: userService.CreateUserInput): Promise<AuthResult> {
  const user = await userService.createUser(input);
  return { token: signToken(user), user };
}
