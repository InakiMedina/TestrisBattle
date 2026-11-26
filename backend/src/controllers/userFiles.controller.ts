import { pipeline } from 'node:stream/promises';
import type { NextFunction, Request, Response } from 'express';
import * as userFilesService from '../services/userFiles.service';
import * as userService from '../services/user.services';
import type { StoredObject } from '../services/s3.service';

// El backend hace de intermediario: lee el archivo de S3 y lo reenvía al cliente.
async function sendStoredObject(res: Response, object: StoredObject): Promise<void> {
  res.setHeader('Content-Type', object.contentType);
  if (object.contentLength !== undefined) res.setHeader('Content-Length', String(object.contentLength));
  // Contenido privado del usuario: no debe guardarse en cachés compartidas.
  res.setHeader('Cache-Control', 'private, no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  await pipeline(object.body, res);
}

const userId = (req: Request) => String(req.params.id);
const backgroundId = (req: Request) => String(req.params.backgroundId);

// ---------------------------------------------------------------------------
// Foto de perfil
// ---------------------------------------------------------------------------

export async function getProfilePicture(req: Request, res: Response, next: NextFunction) {
  try {
    await sendStoredObject(res, await userFilesService.getProfilePicture(userId(req)));
  } catch (error) {
    next(error);
  }
}

export async function uploadProfilePicture(req: Request, res: Response, next: NextFunction) {
  try {
    const { buffer, mimetype } = req.file!;
    res.json(await userFilesService.replaceProfilePicture(userId(req), { buffer, mimetype }));
  } catch (error) {
    next(error);
  }
}

export async function deleteProfilePicture(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await userFilesService.deleteProfilePicture(userId(req)));
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Fondos personalizados
// ---------------------------------------------------------------------------

export async function listBackgrounds(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUserById(userId(req));
    res.json({
      backgrounds: user.customBackgrounds,
      selected: user.background,
      max: userFilesService.MAX_CUSTOM_BACKGROUNDS,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBackground(req: Request, res: Response, next: NextFunction) {
  try {
    await sendStoredObject(res, await userFilesService.getBackground(userId(req), backgroundId(req)));
  } catch (error) {
    next(error);
  }
}

export async function uploadBackground(req: Request, res: Response, next: NextFunction) {
  try {
    const { buffer, mimetype } = req.file!;
    res.status(201).json(await userFilesService.addBackground(userId(req), { buffer, mimetype }));
  } catch (error) {
    next(error);
  }
}

export async function deleteBackground(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await userFilesService.deleteBackground(userId(req), backgroundId(req)));
  } catch (error) {
    next(error);
  }
}
