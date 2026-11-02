import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { HttpError } from '../types/httpError';

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

export function validateCreateUser(req: Request, _res: Response, next: NextFunction) {
  const { username, email, password } = req.body ?? {};

  if (!isString(username) || username.trim().length < 2) {
    return next(new HttpError(400, 'El nombre de usuario debe tener al menos 2 caracteres'));
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
  const { username, email, profilePicture, background } = req.body ?? {};

  if (username === undefined && email === undefined && profilePicture === undefined && background === undefined) {
    return next(new HttpError(400, 'No se envió ningún campo modificable'));
  }
  if (username !== undefined && (!isString(username) || username.trim().length < 2)) {
    return next(new HttpError(400, 'El nombre de usuario debe tener al menos 2 caracteres'));
  }
  if (email !== undefined && (!isString(email) || !EMAIL_REGEX.test(email.trim()))) {
    return next(new HttpError(400, 'Correo electrónico inválido'));
  }
  if (profilePicture !== undefined && !isString(profilePicture)) {
    return next(new HttpError(400, 'profilePicture debe ser texto'));
  }
  if (background !== undefined && !isString(background)) {
    return next(new HttpError(400, 'background debe ser texto'));
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