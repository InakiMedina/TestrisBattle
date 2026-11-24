
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';

import { BackgroundHandler } from '../../../../../../services/background-handler';
import { ImageStorageService } from '../../../../../../services/image-storage.service';
import { Fondo } from '../../../../../../shared/interfaces/fondo';
import { FondoPersonalizado } from '../../../../../../shared/interfaces/fondo-personalizado';


@Component({
  selector: 'app-fondos',
  standalone: true,
  imports: [],
  templateUrl: './fondos.html',
  styleUrl: './fondos.scss'
})
export class Fondos implements OnInit, OnDestroy {

  private readonly backgroundHandler = inject(BackgroundHandler);
  private readonly imageStorage = inject(ImageStorageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly CUSTOM_PREFIX = 'custom:';
  private readonly MAX_IMAGE_SIZE = 8 * 1024 * 1024;

  fondoSeleccionado = '';

  fondos: Fondo[] = [
    { nombre: 'Galaxia azul', ruta: '/backgrounds/bg_1.jpg' },
    { nombre: 'Nebulosa morada', ruta: '/backgrounds/bg_2.avif' },
    { nombre: 'Galaxia rosa', ruta: '/backgrounds/bg_3.webp' },
    { nombre: 'Espacio oscuro', ruta: '/backgrounds/bg_4.jpg' },
    { nombre: 'Nebulosa verde', ruta: '/backgrounds/bg_5.jpg' },
    { nombre: 'Galaxia roja', ruta: '/backgrounds/bg_6.jpg' }
  ];

  fondosPersonalizados: FondoPersonalizado[] = [];

  // Barra de progreso
  subiendoImagen = false;
  progresoSubida = 0;
  mensajeImagen = '';
  mensajeEsError = false;

  // Arrastrar y soltar
  arrastrando = false;

  // Vista previa antes de subir
  archivoPendiente: File | null = null;
  vistaPreviaSubida: string | null = null;

  // Permite cancelar la subida en curso
  private subidaActual: AbortController | null = null;

  ngOnInit(): void {
    this.fondoSeleccionado =
      localStorage.getItem('fondoSeleccionado') ||
      this.fondos[0].ruta;

    this.backgroundHandler.restoreSavedBackground();

    this.cargarFondosPersonalizados();
  }

  
   // Carga los fondos personalizados guardados.
   
  async cargarFondosPersonalizados(): Promise<void> {
    try {
      const imagenes =
        await this.imageStorage.listCustomBackgrounds();

      this.fondosPersonalizados = imagenes.map(imagen => {
        let url = this.imageStorage.getBackgroundUrl(
          imagen.id
        );

        if (!url) {
          url = URL.createObjectURL(imagen.image);

          this.imageStorage.setBackgroundUrl(
            imagen.id,
            url
          );
        }

        return {
          id: imagen.id,
          nombre: `Fondo personalizado ${imagen.id}`,
          ruta: url,
          url,
          imagen: imagen.image
        };
      });

      this.cdr.detectChanges();

    } catch (error) {
      console.error(
        'Error al cargar fondos personalizados:',
        error
      );
    }
  }

  
   // Selecciona un fondo predeterminado o personalizado.
   
  seleccionarFondo(ruta: string): void {
    this.fondoSeleccionado = ruta;

    localStorage.setItem(
      'fondoSeleccionado',
      ruta
    );

    this.backgroundHandler.changeBackground(ruta);

    this.cdr.detectChanges();
  }

  
  // ---------------------------------------------------------------------------
  // Subida: selección (input o arrastrar y soltar) → validación → vista previa
  // → confirmar → progreso (cancelable) → mensaje de éxito o error.
  // ---------------------------------------------------------------------------

  // Selección con el input type="file".
  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    // Limpiar el input para poder elegir de nuevo el mismo archivo.
    input.value = '';

    if (archivo) this.prepararArchivo(archivo);
  }

  // Arrastrar y soltar.
  alArrastrarEncima(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = this.subiendoImagen ? 'none' : 'copy';
    this.arrastrando = !this.subiendoImagen;
  }

  alSalirArrastre(event: DragEvent): void {
    // Ignorar cuando el puntero pasa sobre un elemento hijo de la zona.
    const destino = event.relatedTarget as Node | null;
    if (destino && (event.currentTarget as HTMLElement).contains(destino)) return;
    this.arrastrando = false;
  }

  alSoltar(event: DragEvent): void {
    event.preventDefault();
    this.arrastrando = false;
    if (this.subiendoImagen) return;

    const archivos = event.dataTransfer?.files;
    if (!archivos || archivos.length === 0) return;

    if (archivos.length > 1) {
      this.mostrarMensaje('Arrastra solo una imagen a la vez.', true);
      return;
    }

    this.prepararArchivo(archivos[0]!);
  }

  // Valida el archivo y muestra la vista previa antes de subirlo.
  private prepararArchivo(archivo: File): void {
    if (this.subiendoImagen) return;

    if (!this.esImagenPermitida(archivo)) {
      this.descartarPendiente();
      this.mostrarMensaje(
        `"${archivo.name}" no es un formato permitido. Usa PNG, JPG, WEBP, GIF, AVIF o BMP.`,
        true,
      );
      return;
    }

    if (archivo.size > this.MAX_IMAGE_SIZE) {
      this.descartarPendiente();
      this.mostrarMensaje(
        `"${archivo.name}" pesa ${this.formatearTamano(archivo.size)}. El máximo es ${this.formatearTamano(this.MAX_IMAGE_SIZE)}.`,
        true,
      );
      return;
    }

    this.descartarPendiente();
    this.archivoPendiente = archivo;
    this.vistaPreviaSubida = URL.createObjectURL(archivo);
    this.mostrarMensaje('');
  }

  // Botón "Subir" de la vista previa.
  async confirmarSubida(): Promise<void> {
    const archivo = this.archivoPendiente;
    if (!archivo || this.subiendoImagen) return;

    const id = crypto.randomUUID();
    const clave = `custom-background:${id}`;
    const control = new AbortController();
    this.subidaActual = control;

    this.subiendoImagen = true;
    this.progresoSubida = 0;
    this.mostrarMensaje('Subiendo imagen...');

    try {
      // 1. Avance de la barra (cancelable en cualquier momento).
      for (let progreso = 10; progreso <= 90; progreso += 10) {
        await this.esperar(120, control.signal);
        this.progresoSubida = progreso;
        this.cdr.detectChanges();
      }

      // 2. Guardar la imagen
      await this.imageStorage.save(clave, archivo);

      // Si se canceló justo mientras se guardaba, se deshace.
      if (control.signal.aborted) {
        await this.imageStorage.remove(clave);
        throw new DOMException('Subida cancelada', 'AbortError');
      }

      this.progresoSubida = 100;
      this.cdr.detectChanges();

      // 3. Crear la miniatura
      const url = URL.createObjectURL(archivo);

      this.imageStorage.setBackgroundUrl(id, url);

      this.fondosPersonalizados = [
        {
          id,
          nombre: 'Personalizado',
          ruta: `custom:${id}`,
          url,
          imagen: archivo,
        },
        ...this.fondosPersonalizados,
      ];

      // Marcar el fondo personalizado como seleccionado
      this.fondoSeleccionado = `custom:${id}`;

      // Guardar la selección
      localStorage.setItem(
        'fondoSeleccionado',
        this.fondoSeleccionado
      );

      // 4. Actualizar el fondo del juego
      await this.backgroundHandler.changeBackground(`custom:${id}`);

      this.descartarPendiente();
      this.mostrarMensaje('Imagen cargada correctamente.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        this.mostrarMensaje('Subida cancelada.');
      } else {
        console.error('Error al cargar la imagen:', error);
        this.mostrarMensaje('No se pudo cargar la imagen.', true);
      }
    } finally {
      this.subidaActual = null;
      this.subiendoImagen = false;
      this.progresoSubida = 0;
      this.cdr.detectChanges();
    }
  }

  // Botón "Cancelar": descarta la vista previa o detiene la subida en curso.
  cancelarSubida(): void {
    if (this.subidaActual) {
      this.subidaActual.abort();
      return;
    }
    this.descartarPendiente();
    this.mostrarMensaje('');
  }

  formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private descartarPendiente(): void {
    if (this.vistaPreviaSubida) URL.revokeObjectURL(this.vistaPreviaSubida);
    this.vistaPreviaSubida = null;
    this.archivoPendiente = null;
  }

  private mostrarMensaje(mensaje: string, esError = false): void {
    this.mensajeImagen = mensaje;
    this.mensajeEsError = esError;
    this.cdr.detectChanges();
  }

  // Espera `ms` milisegundos; se interrumpe si se cancela la subida.
  private esperar(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Subida cancelada', 'AbortError'));
        return;
      }
      const timer = setTimeout(resolve, ms);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Subida cancelada', 'AbortError'));
        },
        { once: true },
      );
    });
  }

  
   // Valida los formatos de imagen.
   
  private esImagenPermitida(archivo: File): boolean {
    const formatosPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/bmp'
    ];

    return formatosPermitidos.includes(
      archivo.type
    );
  }
  
   // Elimina un fondo personalizado usando su ID.
   
  async eliminarFondoPersonalizado(
    id: string
  ): Promise<void> {
    const fondo = this.fondosPersonalizados.find(
      item => item.id === id
    );

    if (!fondo) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar el fondo "${fondo.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const clave = `custom-background:${id}`;

      await this.imageStorage.remove(clave);

      this.imageStorage.removeBackgroundUrl(id);

      this.fondosPersonalizados =
        this.fondosPersonalizados.filter(
          item => item.id !== id
        );

      // Si se elimina el fondo seleccionado,
      // regresar al primer fondo predeterminado.
      if (
        this.fondoSeleccionado ===
        `${this.CUSTOM_PREFIX}${id}`
      ) {
        this.seleccionarFondo(
          this.fondos[0].ruta
        );
      }

      this.mensajeImagen =
        'Fondo eliminado correctamente.';

      this.cdr.detectChanges();

    } catch (error) {
      console.error(
        'Error al eliminar el fondo:',
        error
      );

      this.mensajeImagen =
        'No se pudo eliminar el fondo.';
    }
  }

  ngOnDestroy(): void {
    this.subidaActual?.abort();

    if (this.vistaPreviaSubida) {
      URL.revokeObjectURL(
        this.vistaPreviaSubida
      );
    }
  }
}
