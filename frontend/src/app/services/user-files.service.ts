import { HttpClient, HttpContext, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth/auth.service';
import { SKIP_SERVER_ERROR_NOTIFICATION } from '../core/http/http-context';
import { getErrorMessage, getFormErrorMessage } from '../core/http/http-error.util';
import type { IAuthUser, IPublicBackground } from '../core/auth/auth.models';

// Límites y formatos; deben coincidir con los del backend (userFiles.service.ts).
export const MAX_CUSTOM_BACKGROUNDS = 6;
export const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024;
export const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
];

// Valor de `background` cuando está seleccionado un fondo personalizado.
export const CUSTOM_BACKGROUND_PREFIX = 'custom:';

// El backend responde 503 cuando S3 no está configurado o no responde.
export const STORAGE_UNAVAILABLE_STATUS = 503;

export function isStorageUnavailable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === STORAGE_UNAVAILABLE_STATUS;
}

// Mensaje para mostrar al usuario cuando falla una operación de archivos.
export function getFileErrorMessage(error: unknown, fallback: string): string {
  if (isStorageUnavailable(error)) {
    return getErrorMessage(error, 'El almacenamiento de archivos no está disponible en este momento.');
  }
  return getFormErrorMessage(error) ?? fallback;
}

export interface BackgroundUploadResult {
  backgroundId: string;
  user: IAuthUser;
}

export interface BackgroundListResponse {
  backgrounds: IPublicBackground[];
  selected: string;
  max: number;
}

// Servicio que pide al backend los archivos de S3 del usuario actual
// (foto de perfil y fondos personalizados). El backend hace de intermediario,
// así que las imágenes se descargan como Blob con el token de sesión y se
// muestran mediante URLs locales (blob:) que se guardan en caché.
@Injectable({ providedIn: 'root' })
export class UserFilesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  // Caché de URLs locales. La foto se indexa por su clave en S3 (cambia en cada
  // subida) y los fondos por su id, que nunca se reutiliza.
  private profilePicture: { key: string; url: string } | null = null;
  private readonly backgroundUrls = new Map<string, string>();
  private readonly pendingBackgrounds = new Map<string, Promise<string | null>>();

  // Los errores de S3 los manejan los componentes; no se muestra el banner global.
  private readonly context = new HttpContext().set(SKIP_SERVER_ERROR_NOTIFICATION, true);

  private userUrl(): string {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No hay una sesión iniciada');
    return `${environment.apiUrl}/users/${user.id}`;
  }

  // ---------------------------------------------------------------------------
  // Foto de perfil
  // ---------------------------------------------------------------------------

  // URL de la foto del usuario o null si no tiene (se usa la imagen por defecto).
  async getProfilePictureUrl(): Promise<string | null> {
    const key = this.auth.currentUser()?.profilePicture;
    if (!key) {
      this.releaseProfilePicture();
      return null;
    }
    if (this.profilePicture?.key === key) return this.profilePicture.url;

    try {
      const blob = await firstValueFrom(
        this.http.get(`${this.userUrl()}/profile-picture`, {
          responseType: 'blob',
          context: this.context,
        }),
      );
      this.releaseProfilePicture();
      this.profilePicture = { key, url: URL.createObjectURL(blob) };
      return this.profilePicture.url;
    } catch (error) {
      // 404: el archivo ya no está. 503: S3 no disponible. En ambos casos se usa la imagen por defecto.
      if (error instanceof HttpErrorResponse && error.status === 404) return null;
      if (isStorageUnavailable(error)) return null;
      throw error;
    }
  }

  // Sube una foto nueva; el backend elimina la anterior.
  uploadProfilePicture(file: File): Observable<IAuthUser> {
    return this.http
      .put<IAuthUser>(`${this.userUrl()}/profile-picture`, this.toFormData(file), {
        context: this.context,
      })
      .pipe(tap((user) => this.auth.updateCurrentUser(user)));
  }

  // Elimina la foto; el usuario vuelve a la imagen por defecto.
  deleteProfilePicture(): Observable<IAuthUser> {
    return this.http.delete<IAuthUser>(`${this.userUrl()}/profile-picture`, { context: this.context }).pipe(
      tap((user) => {
        this.releaseProfilePicture();
        this.auth.updateCurrentUser(user);
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Fondos personalizados
  // ---------------------------------------------------------------------------

  listBackgrounds(): Observable<BackgroundListResponse> {
    return this.http.get<BackgroundListResponse>(`${this.userUrl()}/backgrounds`, {
      context: this.context,
    });
  }

  // URL local de un fondo personalizado, o null si ya no existe.
  getBackgroundUrl(id: string): Promise<string | null> {
    const cached = this.backgroundUrls.get(id);
    if (cached) return Promise.resolve(cached);

    // Evita descargar dos veces el mismo fondo si se pide desde varios lugares a la vez.
    const pending = this.pendingBackgrounds.get(id);
    if (pending) return pending;

    const request = firstValueFrom(
      this.http.get(`${this.userUrl()}/backgrounds/${id}`, {
        responseType: 'blob',
        context: this.context,
      }),
    )
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        this.backgroundUrls.set(id, url);
        return url;
      })
      .catch((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) return null;
        throw error;
      })
      .finally(() => this.pendingBackgrounds.delete(id));

    this.pendingBackgrounds.set(id, request);
    return request;
  }

  // Guarda en caché el archivo recién subido para no volver a descargarlo de S3.
  cacheBackground(id: string, image: Blob): string {
    this.releaseBackground(id);
    const url = URL.createObjectURL(image);
    this.backgroundUrls.set(id, url);
    return url;
  }

  // Sube un fondo y emite los eventos HTTP para mostrar el progreso real.
  // Cancelar la suscripción cancela la subida.
  uploadBackground(file: File): Observable<HttpEvent<BackgroundUploadResult>> {
    return this.http
      .post<BackgroundUploadResult>(`${this.userUrl()}/backgrounds`, this.toFormData(file), {
        reportProgress: true,
        observe: 'events',
        context: this.context,
      })
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.Response && event.body) {
            this.auth.updateCurrentUser(event.body.user);
          }
        }),
      );
  }

  deleteBackground(id: string): Observable<IAuthUser> {
    return this.http.delete<IAuthUser>(`${this.userUrl()}/backgrounds/${id}`, { context: this.context }).pipe(
      tap((user) => {
        this.releaseBackground(id);
        this.auth.updateCurrentUser(user);
      }),
    );
  }

  // Guarda en MongoDB el fondo seleccionado para restaurarlo en la siguiente sesión.
  saveSelectedBackground(background: string): Observable<IAuthUser> {
    return this.http
      .patch<IAuthUser>(this.userUrl(), { background })
      .pipe(tap((user) => this.auth.updateCurrentUser(user)));
  }

  // Ids de los fondos del usuario actual, del más reciente al más antiguo.
  currentBackgroundIds(): string[] {
    const backgrounds = this.auth.currentUser()?.customBackgrounds ?? [];
    return [...backgrounds]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => item.id);
  }

  // Libera todas las URLs locales (al cerrar sesión).
  clearCache(): void {
    this.releaseProfilePicture();
    for (const url of this.backgroundUrls.values()) URL.revokeObjectURL(url);
    this.backgroundUrls.clear();
    this.pendingBackgrounds.clear();
  }

  private releaseProfilePicture(): void {
    if (this.profilePicture) URL.revokeObjectURL(this.profilePicture.url);
    this.profilePicture = null;
  }

  private releaseBackground(id: string): void {
    const url = this.backgroundUrls.get(id);
    if (url) URL.revokeObjectURL(url);
    this.backgroundUrls.delete(id);
  }

  private toFormData(file: File): FormData {
    const data = new FormData();
    data.append('image', file);
    return data;
  }
}

// Convierte un HttpEvent de progreso en porcentaje (0-100) o null si no aplica.
export function uploadProgress(event: HttpEvent<unknown>): number | null {
  if (event.type !== HttpEventType.UploadProgress || !event.total) return null;
  return Math.round((event.loaded / event.total) * 100);
}

export const toBackgroundRoute = (id: string) => `${CUSTOM_BACKGROUND_PREFIX}${id}`;
