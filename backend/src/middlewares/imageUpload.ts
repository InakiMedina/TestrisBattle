import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { HttpError } from '../types/httpError';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_BACKGROUND_BYTES,
  MAX_PROFILE_PICTURE_BYTES,
} from '../services/userFiles.service';

// Nombre del campo multipart/form-data que debe traer la imagen.
export const IMAGE_FIELD = 'image';

const formatMb = (bytes: number) => `${bytes / (1024 * 1024)} MB`;

// El archivo se mantiene en memoria (como máximo unos MB) y se envía directo a S3.
function createImageUpload(maxBytes: number) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
        callback(new HttpError(400, 'Formato no permitido. Usa PNG, JPG, WEBP, GIF, AVIF o BMP.'));
        return;
      }
      callback(null, true);
    },
  }).single(IMAGE_FIELD);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(new HttpError(413, `La imagen no debe pesar más de ${formatMb(maxBytes)}`));
        }
        return next(new HttpError(400, `Solo se permite un archivo en el campo "${IMAGE_FIELD}"`));
      }
      if (error) return next(error);
      if (!req.file) return next(new HttpError(400, `Debes enviar una imagen en el campo "${IMAGE_FIELD}"`));
      next();
    });
  };
}

export const uploadProfilePicture = createImageUpload(MAX_PROFILE_PICTURE_BYTES);
export const uploadBackground = createImageUpload(MAX_BACKGROUND_BYTES);
