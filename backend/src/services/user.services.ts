import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { HttpError } from '../types/httpError';

const SALT_ROUNDS = 10;

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

interface MongoDuplicateError {
  code?: number;
  keyPattern?: Record<string, unknown>;
}

function rethrowMongoError(error: unknown): never {
  const e = error as MongoDuplicateError;
  if (e?.code === 11000) {
    const field = Object.keys(e.keyPattern ?? {})[0];
    const message =
      field === 'email' ? 'El correo electrónico ya está registrado'
      : field === 'username' ? 'El nombre de usuario ya está en uso'
      : 'El usuario ya existe';
    throw new HttpError(409, message);
  }
  throw error;
}

export async function createUser(input: CreateUserInput) {
  const hashPass = await bcrypt.hash(input.password, SALT_ROUNDS);
  try {
    const created = await User.create({
      username: input.username,
      email: input.email,
      hashPass,
    });
    // select:false solo aplica a consultas, no al documento recién creado
    const { hashPass: _omit, ...safeUser } = created.toObject();
    return safeUser;
  } catch (error) {
    rethrowMongoError(error);
  }
}

export async function getUsers(page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const [users, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    User.countDocuments(),
  ]);
  return { users, total, page: safePage, limit: safeLimit };
}

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  return user;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    return user;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    rethrowMongoError(error);
  }
}

export async function changePassword(id: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(id).select('+hashPass');
  if (!user) throw new HttpError(404, 'Usuario no encontrado');

  const matches = await bcrypt.compare(currentPassword, user.hashPass);
  if (!matches) throw new HttpError(400, 'La contraseña actual es incorrecta');

  user.hashPass = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
}

export async function deleteUser(id: string) {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
}