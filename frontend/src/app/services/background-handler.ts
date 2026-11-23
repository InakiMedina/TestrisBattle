
import { Injectable, inject } from '@angular/core';
import { ImageStorageService } from './image-storage.service';

const DEFAULT_BACKGROUND = '/backgrounds/city_image.jpg';
const CUSTOM_PREFIX = 'custom:';

@Injectable({
  providedIn: 'root'
})
export class BackgroundHandler {
  private readonly imageStorage = inject(ImageStorageService);

  private currentObjectUrl: string | null = null;
  private currentBackground: string | null = null;

  async restoreSavedBackground(): Promise<void> {
    const selected =
      localStorage.getItem('fondoSeleccionado') ||
      DEFAULT_BACKGROUND;

    await this.changeBackground(selected);
  }

  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve();
      image.onerror = () => reject();

      image.src = url;
    });
  }

  async changeBackground(route: string): Promise<void> {
    // Evitar volver a aplicar el mismo fondo.
    if (this.currentBackground === route) {
      return;
    }

    if (route.startsWith(CUSTOM_PREFIX)) {
      const id = route.substring(CUSTOM_PREFIX.length);

      try {
        const image = await this.imageStorage.get(
          `custom-background:${id}`
        );

        if (!image) {
          this.apply(DEFAULT_BACKGROUND);
          return;
        }

        const imageUrl = URL.createObjectURL(image);

        try {
          // Esperar a que la imagen esté cargada.
          await this.preloadImage(imageUrl);

          // Aplicar el fondo cuando ya esté listo.
          this.apply(imageUrl, true, route);
        } catch {
          URL.revokeObjectURL(imageUrl);
          this.apply(DEFAULT_BACKGROUND);
        }
      } catch {
        this.apply(DEFAULT_BACKGROUND);
      }

      return;
    }

    this.apply(route);
  }

  private apply(
    route: string,
    isObjectUrl = false,
    backgroundKey = route
  ): void {
    const previousObjectUrl = this.currentObjectUrl;

    // Cambiar el fondo sin limpiarlo previamente.
    document.body.style.backgroundImage =
      `url("${route}")`;

    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';

    this.currentBackground = backgroundKey;
    this.currentObjectUrl = isObjectUrl ? route : null;

    // Liberar la URL anterior después de aplicar la nueva.
    if (
      previousObjectUrl &&
      previousObjectUrl !== this.currentObjectUrl
    ) {
      URL.revokeObjectURL(previousObjectUrl);
    }
  }
}
