import { randomUUID } from 'node:crypto';
import type { IAuthUser } from '@shared/types/auth.types';
import { User } from '../models/user.model';
import { HttpError } from '../types/httpError';
import { toPublicUser } from './user.mapper';
import * as s3 from './s3.service';

// Estructura en el bucket:
//   users/{userId}/profile/<uuid>.<ext>
//   users/{userId}/backgrounds/<uuid>.<ext>
// Se usa un nombre nuevo en cada subida para que nunca se sirva una versión vieja en caché.

export const MAX_CUSTOM_BACKGROUNDS = 6;
export const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024;
export const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;

// Formatos permitidos y la extensión con la que se guardan en S3.
export const ALLOWED_IMAGE_TYPES: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
};

// Valor de `background` cuando el usuario selecciona uno de sus fondos personalizados.
export const CUSTOM_BACKGROUND_PREFIX = 'custom:';

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

function buildKey(userId: string, folder: 'profile' | 'backgrounds', mimetype: string): string {
  const extension = ALLOWED_IMAGE_TYPES[mimetype];
  if (!extension) throw new HttpError(400, 'Formato de imagen no permitido');
  return `users/${userId}/${folder}/${randomUUID()}.${extension}`;
}

// Borra un archivo sin interrumpir la operación principal si S3 falla:
// el archivo queda huérfano, pero los datos del usuario siguen siendo consistentes.
async function deleteQuietly(key: string): Promise<void> {
  try {
    await s3.deleteObject(key);
  } catch (error) {
    console.error(`No se pudo borrar ${key} de S3:`, error);
  }
}

// Las operaciones que modifican archivos requieren S3: si no está configurado
// se rechazan antes de tocar MongoDB para no dejar referencias inconsistentes.
function requireStorage(): void {
  if (!s3.isS3Configured()) throw new HttpError(503, s3.STORAGE_UNAVAILABLE_MESSAGE);
}

async function findUserOrFail(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  return user;
}

// ---------------------------------------------------------------------------
// Foto de perfil (solo una por usuario)
// ---------------------------------------------------------------------------

export async function getProfilePicture(userId: string): Promise<s3.StoredObject> {
  const user = await findUserOrFail(userId);
  if (!user.profilePicture) throw new HttpError(404, 'El usuario no tiene foto de perfil');
  return s3.getObject(user.profilePicture);
}

// Sube la nueva foto y, una vez guardada la referencia, elimina la anterior.
export async function replaceProfilePicture(userId: string, file: UploadedImage): Promise<IAuthUser> {
  requireStorage();
  const user = await findUserOrFail(userId);
  const previousKey = user.profilePicture;
  const newKey = buildKey(userId, 'profile', file.mimetype);

  await s3.putObject(newKey, file.buffer, file.mimetype);

  try {
    user.profilePicture = newKey;
    await user.save();
  } catch (error) {
    await deleteQuietly(newKey);
    throw error;
  }

  if (previousKey) await deleteQuietly(previousKey);
  return toPublicUser(user);
}

// Elimina la foto: el usuario vuelve a la imagen por defecto de la aplicación.
export async function deleteProfilePicture(userId: string): Promise<IAuthUser> {
  requireStorage();
  const user = await findUserOrFail(userId);
  const previousKey = user.profilePicture;
  if (!previousKey) return toPublicUser(user);

  user.profilePicture = '';
  await user.save();
  await deleteQuietly(previousKey);
  return toPublicUser(user);
}

// ---------------------------------------------------------------------------
// Fondos personalizados (máximo MAX_CUSTOM_BACKGROUNDS por usuario)
// ---------------------------------------------------------------------------

export async function getBackground(userId: string, backgroundId: string): Promise<s3.StoredObject> {
  const user = await findUserOrFail(userId);
  const background = user.customBackgrounds.find((item) => String(item.id) === backgroundId);
  if (!background) throw new HttpError(404, 'Fondo no encontrado');
  return s3.getObject(background.key);
}

// Sube un fondo y lo deja seleccionado.
export async function addBackground(
  userId: string,
  file: UploadedImage,
): Promise<{ user: IAuthUser; backgroundId: string }> {
  requireStorage();
  const user = await findUserOrFail(userId);
  if (user.customBackgrounds.length >= MAX_CUSTOM_BACKGROUNDS) {
    throw new HttpError(400, `Solo puedes tener ${MAX_CUSTOM_BACKGROUNDS} fondos personalizados`);
  }

  const key = buildKey(userId, 'backgrounds', file.mimetype);
  await s3.putObject(key, file.buffer, file.mimetype);

  try {
    // La condición sobre el índice evita superar el máximo si llegan dos subidas a la vez.
    const updated = await User.findOneAndUpdate(
      { _id: userId, [`customBackgrounds.${MAX_CUSTOM_BACKGROUNDS - 1}`]: { $exists: false } },
      { $push: { customBackgrounds: { key, createdAt: new Date() } } },
      { new: true },
    );
    if (!updated) {
      throw new HttpError(400, `Solo puedes tener ${MAX_CUSTOM_BACKGROUNDS} fondos personalizados`);
    }

    const added = updated.customBackgrounds.find((item) => item.key === key);
    const backgroundId = String(added?.id);
    updated.background = `${CUSTOM_BACKGROUND_PREFIX}${backgroundId}`;
    await updated.save();

    return { user: toPublicUser(updated), backgroundId };
  } catch (error) {
    await deleteQuietly(key);
    throw error;
  }
}

// Elimina un fondo. Si era el seleccionado, el usuario vuelve al fondo por defecto.
export async function deleteBackground(userId: string, backgroundId: string): Promise<IAuthUser> {
  requireStorage();
  const user = await findUserOrFail(userId);
  const background = user.customBackgrounds.find((item) => String(item.id) === backgroundId);
  if (!background) throw new HttpError(404, 'Fondo no encontrado');

  const key = background.key;
  user.customBackgrounds = user.customBackgrounds.filter((item) => String(item.id) !== backgroundId);
  if (user.background === `${CUSTOM_BACKGROUND_PREFIX}${backgroundId}`) {
    user.background = '';
  }
  await user.save();

  await deleteQuietly(key);
  return toPublicUser(user);
}

// ---------------------------------------------------------------------------
// Limpieza al eliminar una cuenta
// ---------------------------------------------------------------------------

export async function deleteAllUserFiles(user: {
  profilePicture?: string;
  customBackgrounds?: { key: string }[];
}): Promise<void> {
  const keys = [
    ...(user.profilePicture ? [user.profilePicture] : []),
    ...(user.customBackgrounds ?? []).map((item) => item.key),
  ];
  if (keys.length === 0) return;
  if (!s3.isS3Configured()) {
    console.warn(`S3 no configurado: no se borraron ${keys.length} archivo(s) del usuario eliminado`);
    return;
  }

  try {
    await s3.deleteObjects(keys);
  } catch (error) {
    console.error('No se pudieron borrar los archivos del usuario en S3:', error);
  }
}
