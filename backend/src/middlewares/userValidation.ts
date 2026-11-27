import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { HttpError } from '../types/httpError';
import { getUsernameError } from '../utils/username';

// Esta parte quizá haya que borrarla después porque de todas formas ya validamos en signin los datos ingresados del lado del cliente
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isString = (v: unknown): v is string => typeof v === 'string';

const validPassword = (v: unknown): v is string =>
  isString(v) && v.length >= 8 && Buffer.byteLength(v) <= 72;

export function validateObjectId(req: Request, _res: Response, next: NextFunction) {
  if (!Types.ObjectId.isValid(String(req.params.id))) {
    return next(new HttpError(400, 'ID de usuario inválido'));
  }
  next();
}

export function validateBackgroundId(req: Request, _res: Response, next: NextFunction) {
  if (!Types.ObjectId.isValid(String(req.params.backgroundId))) {
    return next(new HttpError(400, 'ID de fondo inválido'));
  }
  next();
}

// Valores aceptados para `background`:
//   ''                      → fondo por defecto de la aplicación
//   '/backgrounds/<archivo>' → uno de los fondos predeterminados del frontend
//   'custom:<id>'           → uno de los fondos personalizados del usuario
const BACKGROUND_REGEX = /^(|\/backgrounds\/[\w.-]+|custom:[a-f\d]{24})$/i;

export function validateCreateUser(req: Request, _res: Response, next: NextFunction) {
  const { username, email, password } = req.body ?? {};

  const usernameError = getUsernameError(username);
  if (usernameError) {
    return next(new HttpError(400, usernameError));
  }
  if (!isString(email) || !EMAIL_REGEX.test(email.trim())) {
    return next(new HttpError(400, 'Correo electrónico inválido'));
  }
  if (!validPassword(password)) {
    return next(new HttpError(400, 'La contraseña debe tener entre 8 y 72 bytes'));
  }
  next();
}

export function validateUpdateUser(req: Request, _res: Response, next: NextFunction) {
  // profilePicture ya no se acepta aquí: se gestiona con /users/:id/profile-picture (S3).
  const { username, email, background } = req.body ?? {};

  if (username === undefined && email === undefined && background === undefined) {
    return next(new HttpError(400, 'No se envió ningún campo modificable'));
  }
  if (username !== undefined) {
    const usernameError = getUsernameError(username);
    if (usernameError) return next(new HttpError(400, usernameError));
  }
  if (email !== undefined && (!isString(email) || !EMAIL_REGEX.test(email.trim()))) {
    return next(new HttpError(400, 'Correo electrónico inválido'));
  }
  if (background !== undefined && (!isString(background) || !BACKGROUND_REGEX.test(background))) {
    return next(new HttpError(400, 'background no es un fondo válido'));
  }
  next();
}

export function validateChangePassword(req: Request, _res: Response, next: NextFunction) {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!isString(currentPassword) || currentPassword.length === 0) {
    return next(new HttpError(400, 'Debes enviar la contraseña actual'));
  }
  if (!validPassword(newPassword)) {
    return next(new HttpError(400, 'La nueva contraseña debe tener entre 8 y 72 bytes'));
  }
  next();
}