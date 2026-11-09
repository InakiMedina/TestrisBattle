/*
NOTA: las llamadas a MongoDB están comentadas porque la base de datos aún no está lista.
Mientras tanto se usa el almacén en memoria (user.store.ts).
Al conectar Atlas se descomentará el bloque "MongoDB" de cada función,
se borrará la versión "Almacén en memoria" de esa misma función,
se descomentará el import de User y rethrowMongoError, y ajustará toPublicUser (Mongo devuelve _id en lugar de id).
 */

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { IAuthUser } from '@shared/types/auth.types';
// import { User } from '../models/user.model';
import { HttpError } from '../types/httpError';
import { SALT_ROUNDS, defaultProfile, findById, toPublicUser, users } from './user.store';

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  profilePicture?: string;
  background?: string;
}

// --- MongoDB: manejo de duplicados (error 11000) ---
// interface MongoDuplicateError {
//   code?: number;
//   keyPattern?: Record<string, unknown>;
// }
//
// function rethrowMongoError(error: unknown): never {
//   const e = error as MongoDuplicateError;
//   if (e?.code === 11000) {
//     const field = Object.keys(e.keyPattern ?? {})[0];
//     const message =
//       field === 'email' ? 'El correo electrónico ya está registrado'
//       : field === 'username' ? 'El nombre de usuario ya está en uso'
//       : 'El usuario ya existe';
//     throw new HttpError(409, message);
//   }
//   throw error;
// }

// --- Almacén en memoria: validación de duplicados (Mongo lo hace con el índice unique) ---
function assertUnique(fields: UpdateUserInput, exceptId?: string): void {
  if (fields.email !== undefined) {
    const email = fields.email.trim().toLowerCase();
    if (users.some((u) => u.id !== exceptId && u.email === email)) {
      throw new HttpError(409, 'El correo electrónico ya está registrado');
    }
  }
  if (fields.username !== undefined) {
    const username = fields.username.trim().toLowerCase();
    if (users.some((u) => u.id !== exceptId && u.username.toLowerCase() === username)) {
      throw new HttpError(409, 'El nombre de usuario ya está en uso');
    }
  }
}

// ---------------------------------------------------------------- createUser
// MongoDB
// export async function createUser(input: CreateUserInput) {
//   const hashPass = await bcrypt.hash(input.password, SALT_ROUNDS);
//   try {
//     const created = await User.create({
//       username: input.username,
//       email: input.email,
//       hashPass,
//       role: 'usuario', // el rol nunca viene del cliente
//     });
//     // select:false solo aplica a consultas, no al documento recién creado
//     const { hashPass: _omit, ...safeUser } = created.toObject();
//     return safeUser;
//   } catch (error) {
//     rethrowMongoError(error);
//   }
// }

// Almacén en memoria
export async function createUser(input: CreateUserInput): Promise<IAuthUser> {
  assertUnique({ username: input.username, email: input.email });
  const created = {
    id: randomUUID(),
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    hashPass: await bcrypt.hash(input.password, SALT_ROUNDS),
    role: 'usuario' as const, // el rol nunca viene del cliente
    ...defaultProfile(),
  };
  users.push(created);
  return toPublicUser(created);
}

// ------------------------------------------------------------------ getUsers
// MongoDB
// export async function getUsers(page = 1, limit = 20) {
//   const safeLimit = Math.min(Math.max(limit, 1), 100);
//   const safePage = Math.max(page, 1);
//   const [users, total] = await Promise.all([
//     User.find()
//       .sort({ createdAt: -1 })
//       .skip((safePage - 1) * safeLimit)
//       .limit(safeLimit),
//     User.countDocuments(),
//   ]);
//   return { users, total, page: safePage, limit: safeLimit };
// }

// Almacén en memoria
export async function getUsers(page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const start = (safePage - 1) * safeLimit;
  return {
    users: users.slice(start, start + safeLimit).map(toPublicUser),
    total: users.length,
    page: safePage,
    limit: safeLimit,
  };
}

// ------------------------------------------------------------- getUserById
// MongoDB
// export async function getUserById(id: string) {
//   const user = await User.findById(id);
//   if (!user) throw new HttpError(404, 'Usuario no encontrado');
//   return user;
// }

// Almacén en memoria
export async function getUserById(id: string): Promise<IAuthUser> {
  const user = findById(id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  return toPublicUser(user);
}

// -------------------------------------------------------------- updateUser
// MongoDB
// export async function updateUser(id: string, data: UpdateUserInput) {
//   try {
//     const user = await User.findByIdAndUpdate(
//       id,
//       { $set: data },
//       { new: true, runValidators: true },
//     );
//     if (!user) throw new HttpError(404, 'Usuario no encontrado');
//     return user;
//   } catch (error) {
//     if (error instanceof HttpError) throw error;
//     rethrowMongoError(error);
//   }
// }

// Almacén en memoria
export async function updateUser(id: string, data: UpdateUserInput): Promise<IAuthUser> {
  const user = findById(id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  assertUnique(data, id);
  if (data.username !== undefined) user.username = data.username;
  if (data.email !== undefined) user.email = data.email.toLowerCase();
  if (data.profilePicture !== undefined) user.profilePicture = data.profilePicture;
  if (data.background !== undefined) user.background = data.background;
  return toPublicUser(user);
}

// ---------------------------------------------------------- changePassword
// MongoDB
// export async function changePassword(id: string, currentPassword: string, newPassword: string) {
//   const user = await User.findById(id).select('+hashPass');
//   if (!user) throw new HttpError(404, 'Usuario no encontrado');
//
//   // 400 y no 401: un 401 haría que el front cierre la sesión.
//   const matches = await bcrypt.compare(currentPassword, user.hashPass);
//   if (!matches) throw new HttpError(400, 'La contraseña actual es incorrecta');
//
//   user.hashPass = await bcrypt.hash(newPassword, SALT_ROUNDS);
//   await user.save();
// }

// Almacén en memoria
export async function changePassword(id: string, currentPassword: string, newPassword: string) {
  const user = findById(id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  // 400 y no 401: un 401 haría que el front cierre la sesión.
  if (!(await bcrypt.compare(currentPassword, user.hashPass))) {
    throw new HttpError(400, 'La contraseña actual es incorrecta');
  }
  user.hashPass = await bcrypt.hash(newPassword, SALT_ROUNDS);
}

// -------------------------------------------------------------- deleteUser
// MongoDB
// export async function deleteUser(id: string, requesterId: string) {
//   if (id === requesterId) {
//     throw new HttpError(400, 'No puedes eliminar tu propia cuenta');
//   }
//   const user = await User.findByIdAndDelete(id);
//   if (!user) throw new HttpError(404, 'Usuario no encontrado');
// }

// Almacén en memoria
export async function deleteUser(id: string, requesterId: string): Promise<void> {
  if (id === requesterId) {
    throw new HttpError(400, 'No puedes eliminar tu propia cuenta');
  }
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) throw new HttpError(404, 'Usuario no encontrado');
  users.splice(index, 1);
}
