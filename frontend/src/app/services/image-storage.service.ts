
import { Injectable } from '@angular/core';

const DB_NAME = 'tetris-battle-local-images';
const STORE_NAME = 'images';
const CUSTOM_BACKGROUND_PREFIX = 'custom-background:';

@Injectable({
  providedIn: 'root',
})
export class ImageStorageService {
  /**
   * Caché de URLs para las miniaturas.
   * Se conserva mientras la aplicación está abierta.
   */
  private readonly backgroundUrls = new Map<string, string>();

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  
   // Guarda una imagen en IndexedDB.
   
  async save(key: string, image: Blob): Promise<void> {
    const database = await this.openDatabase();

    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          STORE_NAME,
          'readwrite',
        );

        const store = transaction.objectStore(STORE_NAME);

        store.put(image, key);

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };

        transaction.onabort = () => {
          reject(transaction.error);
        };
      });

      // Si se reemplazó una imagen, invalidar su URL anterior.
      if (key.startsWith(CUSTOM_BACKGROUND_PREFIX)) {
        const id = key.substring(
          CUSTOM_BACKGROUND_PREFIX.length,
        );

        this.removeBackgroundUrl(id);
      }
    } finally {
      database.close();
    }
  }

  
   // Recupera una imagen de IndexedDB.
   
  async get(key: string): Promise<Blob | null> {
    const database = await this.openDatabase();

    try {
      return await new Promise<Blob | null>((resolve, reject) => {
        const transaction = database.transaction(
          STORE_NAME,
          'readonly',
        );

        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;

          resolve(result instanceof Blob ? result : null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } finally {
      database.close();
    }
  }

  
   // Recupera todos los fondos personalizados.
   
  async listCustomBackgrounds(): Promise<
    Array<{ id: string; image: Blob }>
  > {
    const database = await this.openDatabase();

    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(
          STORE_NAME,
          'readonly',
        );

        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();

        const images: Array<{ id: string; image: Blob }> = [];

        request.onsuccess = () => {
          const cursor = request.result;

          if (!cursor) {
            resolve(images);
            return;
          }

          const key = String(cursor.key);

          if (
            key.startsWith(CUSTOM_BACKGROUND_PREFIX) &&
            cursor.value instanceof Blob
          ) {
            images.push({
              id: key.substring(CUSTOM_BACKGROUND_PREFIX.length),
              image: cursor.value,
            });
          }

          cursor.continue();
        };

        request.onerror = () => {
          reject(request.error);
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };
      });
    } finally {
      database.close();
    }
  }

  
   // Obtiene una URL de miniatura que ya esté en caché.
   
  getBackgroundUrl(id: string): string | null {
    return this.backgroundUrls.get(id) ?? null;
  }

  
  // Guarda una URL de miniatura en caché.
  
  setBackgroundUrl(id: string, url: string): void {
    const previousUrl = this.backgroundUrls.get(id);

    if (previousUrl && previousUrl !== url) {
      URL.revokeObjectURL(previousUrl);
    }

    this.backgroundUrls.set(id, url);
  }

  
   // Elimina y libera la URL de una miniatura.
   
  removeBackgroundUrl(id: string): void {
    const url = this.backgroundUrls.get(id);

    if (url) {
      URL.revokeObjectURL(url);
      this.backgroundUrls.delete(id);
    }
  }

  
   // Elimina una imagen de IndexedDB.
   
  async remove(key: string): Promise<void> {
    const database = await this.openDatabase();

    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          STORE_NAME,
          'readwrite',
        );

        const store = transaction.objectStore(STORE_NAME);

        store.delete(key);

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };

        transaction.onabort = () => {
          reject(transaction.error);
        };
      });

      if (key.startsWith(CUSTOM_BACKGROUND_PREFIX)) {
        const id = key.substring(
          CUSTOM_BACKGROUND_PREFIX.length,
        );

        this.removeBackgroundUrl(id);
      }
    } finally {
      database.close();
    }
  }
}
