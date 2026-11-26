import type { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import config from '../config/config';
import { HttpError } from '../types/httpError';

// S3 es opcional: si faltan las credenciales o el bucket, el resto de la
// aplicación funciona igual y las operaciones de archivos responden 503.
export const STORAGE_UNAVAILABLE_MESSAGE =
  'El almacenamiento de archivos no está disponible en este momento';

const { region, accessKeyId, secretAccessKey, sessionToken, s3BucketName } = config.aws;

export function isS3Configured(): boolean {
  return Boolean(accessKeyId && secretAccessKey && s3BucketName);
}

// Cliente único, creado solo si hay credenciales.
const s3: S3Client | null = isS3Configured()
  ? new S3Client({
      region,
      // Si S3 no responde, se falla rápido en lugar de dejar la petición colgada.
      maxAttempts: 2,
      requestHandler: { connectionTimeout: 3000, requestTimeout: 15000 },
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    })
  : null;

// DeleteObjects admite como máximo 1000 claves por petición.
const MAX_KEYS_PER_DELETE = 1000;

export interface StoredObject {
  body: Readable;
  contentType: string;
  contentLength?: number;
}

// Mensaje de diagnóstico para el log del servidor (no se envía al cliente).
function describeS3Error(error: unknown): string {
  if (error instanceof S3ServiceException) {
    const hints: Record<string, string> = {
      ExpiredToken: 'las credenciales expiraron (en AWS Academy se renuevan al reiniciar el lab)',
      InvalidAccessKeyId: 'AWS_ACCESS_KEY_ID no es válida',
      SignatureDoesNotMatch: 'AWS_SECRET_ACCESS_KEY no es válida',
      InvalidToken: 'AWS_SESSION_TOKEN no es válido',
      AccessDenied: 'las credenciales no tienen permiso sobre el bucket',
      NoSuchBucket: `el bucket "${s3BucketName}" no existe`,
    };
    return `${error.name}: ${hints[error.name] ?? error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

// Ejecuta una operación contra S3 y convierte cualquier fallo de conexión,
// credenciales o permisos en un 503 para que el cliente use los valores por defecto.
async function run<T>(operation: (client: S3Client) => Promise<T>): Promise<T> {
  if (!s3) throw new HttpError(503, STORAGE_UNAVAILABLE_MESSAGE);
  try {
    return await operation(s3);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof NoSuchKey) throw new HttpError(404, 'Archivo no encontrado');
    console.error(`[S3] Operación fallida — ${describeS3Error(error)}`);
    throw new HttpError(503, STORAGE_UNAVAILABLE_MESSAGE);
  }
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await run((client) =>
    client.send(
      new PutObjectCommand({
        Bucket: s3BucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    ),
  );
}

// Devuelve el archivo como stream para reenviarlo al cliente sin cargarlo completo en memoria.
export async function getObject(key: string): Promise<StoredObject> {
  const result = await run((client) =>
    client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: key })),
  );
  if (!result.Body) throw new HttpError(404, 'Archivo no encontrado');

  const object: StoredObject = {
    body: result.Body as Readable,
    contentType: result.ContentType || 'application/octet-stream',
  };
  if (result.ContentLength !== undefined) object.contentLength = result.ContentLength;
  return object;
}

export async function deleteObject(key: string): Promise<void> {
  await run((client) => client.send(new DeleteObjectCommand({ Bucket: s3BucketName, Key: key })));
}

export async function deleteObjects(keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += MAX_KEYS_PER_DELETE) {
    const chunk = keys.slice(i, i + MAX_KEYS_PER_DELETE);
    if (chunk.length === 0) continue;
    await run((client) =>
      client.send(
        new DeleteObjectsCommand({
          Bucket: s3BucketName,
          Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
        }),
      ),
    );
  }
}
