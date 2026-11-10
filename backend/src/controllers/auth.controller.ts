import type { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { HttpError } from '../types/httpError';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw new HttpError(400, 'Debes enviar correo y contraseña');
    }
    res.status(200).json(await authService.login(email, password));
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register({
      username: username.trim(),
      email: email.trim(),
      password,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export function me(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}
