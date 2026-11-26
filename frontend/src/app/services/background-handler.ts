import { Injectable, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { CUSTOM_BACKGROUND_PREFIX, UserFilesService } from './user-files.service';

// Fondo que se usa cuando el usuario no ha elegido ninguno.
export const DEFAULT_BACKGROUND = '/backgrounds/city_image.jpg';

@Injectable({
  providedIn: 'root'
})
export class BackgroundHandler {
  private readonly auth = inject(AuthService);
  private readonly userFiles = inject(UserFilesService);

  private currentBackground: string | null = null;
  // Evita que una carga lenta reemplace a un fondo elegido después.
  private requestId = 0;

  // Aplica el fondo que el usuario dejó seleccionado (guardado en MongoDB).
  async restoreSavedBackground(): Promise<void> {
    await this.changeBackground(this.auth.currentUser()?.background || DEFAULT_BACKGROUND);
  }

  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve();
      image.onerror = () => reject();

      image.src = url;
    });
  }

  // Acepta una ruta de fondo predeterminado ('/backgrounds/...') o 'custom:<id>'.
  async changeBackground(route: string): Promise<void> {
    const background = route || DEFAULT_BACKGROUND;

    // Evitar volver a aplicar el mismo fondo.
    if (this.currentBackground === background) {
      return;
    }

    const request = ++this.requestId;

    if (!background.startsWith(CUSTOM_BACKGROUND_PREFIX)) {
      this.apply(background, background);
      return;
    }

    try {
      const url = await this.userFiles.getBackgroundUrl(
        background.substring(CUSTOM_BACKGROUND_PREFIX.length),
      );
      if (request !== this.requestId) return;

      if (!url) {
        this.apply(DEFAULT_BACKGROUND, DEFAULT_BACKGROUND);
        return;
      }

      // Esperar a que la imagen esté cargada para aplicarla sin parpadeo.
      await this.preloadImage(url);
      if (request !== this.requestId) return;

      this.apply(url, background);
    } catch {
      if (request === this.requestId) this.apply(DEFAULT_BACKGROUND, DEFAULT_BACKGROUND);
    }
  }

  // Quita el fondo aplicado (al cerrar sesión).
  reset(): void {
    this.requestId++;
    this.currentBackground = null;
    document.body.style.removeProperty('background-image');
    document.body.style.removeProperty('background-size');
    document.body.style.removeProperty('background-position');
    document.body.style.removeProperty('background-attachment');
    document.body.style.removeProperty('background-repeat');
  }

  // Las URLs blob: pertenecen a la caché de UserFilesService; aquí no se liberan.
  private apply(url: string, backgroundKey: string): void {
    document.body.style.backgroundImage = `url("${url}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';

    this.currentBackground = backgroundKey;
  }
}
