
import { HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../../../../core/auth/auth.service';
import { getFormErrorMessage } from '../../../../../../core/http/http-error.util';
import { BackgroundHandler, DEFAULT_BACKGROUND } from '../../../../../../services/background-handler';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_BACKGROUND_BYTES,
  MAX_CUSTOM_BACKGROUNDS,
  UserFilesService,
  getFileErrorMessage,
  isStorageUnavailable,
  toBackgroundRoute,
  uploadProgress,
} from '../../../../../../services/user-files.service';
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

  private readonly auth = inject(AuthService);
  private readonly backgroundHandler = inject(BackgroundHandler);
  private readonly userFiles = inject(UserFilesService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly MAX_IMAGE_SIZE = MAX_BACKGROUND_BYTES;
  readonly MAX_FONDOS_PERSONALIZADOS = MAX_CUSTOM_BACKGROUNDS;
  readonly formatosPermitidos = ALLOWED_IMAGE_TYPES.join(',');

  fondoSeleccionado = '';

  // Fondos predeterminados del proyecto (viven en /public/backgrounds, nunca en S3).
  fondos: Fondo[] = [
    { nombre: 'Ciudad', ruta: DEFAULT_BACKGROUND },
    { nombre: 'Galaxia azul', ruta: '/backgrounds/bg_1.jpg' },
    { nombre: 'Nebulosa morada', ruta: '/backgrounds/bg_2.avif' },
    { nombre: 'Espacio oscuro', ruta: '/backgrounds/bg_4.jpg' },
    { nombre: 'Nebulosa verde', ruta: '/backgrounds/bg_5.jpg' },
    { nombre: 'Galaxia roja', ruta: '/backgrounds/bg_6.jpg' }
  ];

  // Fondos que el usuario subió a S3.
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
  private subidaActual: Subscription | null = null;

  get limiteAlcanzado(): boolean {
    return this.fondosPersonalizados.length >= this.MAX_FONDOS_PERSONALIZADOS;
  }

  ngOnInit(): void {
    this.fondoSeleccionado = this.auth.currentUser()?.background || DEFAULT_BACKGROUND;
    void this.cargarFondosPersonalizados();
  }


   // Carga los fondos personalizados del usuario desde S3 (a través del backend).

  async cargarFondosPersonalizados(): Promise<void> {
    const ids = this.userFiles.currentBackgroundIds();

    // Mientras se descargan se muestran las tarjetas vacías.
    this.fondosPersonalizados = ids.map((id) => this.crearFondoPersonalizado(id, null));
    this.cdr.detectChanges();

    let almacenamientoNoDisponible = false;
    const cargados = await Promise.all(
      ids.map(async (id) => {
        try {
          return this.crearFondoPersonalizado(id, await this.userFiles.getBackgroundUrl(id));
        } catch (error) {
          if (isStorageUnavailable(error)) almacenamientoNoDisponible = true;
          else console.error('Error al cargar el fondo personalizado:', error);
          return this.crearFondoPersonalizado(id, null);
        }
      }),
    );

    // Se conservan los fondos subidos mientras se cargaba la lista;
    // los que ya no existen en S3 no se muestran.
    const nuevos = this.fondosPersonalizados.filter((fondo) => !ids.includes(fondo.id));
    this.fondosPersonalizados = [...nuevos, ...cargados.filter((fondo) => fondo.url !== null)];
    this.cdr.detectChanges();

    // Sin S3 solo se muestran los fondos predeterminados.
    if (almacenamientoNoDisponible) {
      this.mostrarMensaje(
        'Tus fondos personalizados no están disponibles en este momento. Puedes usar los predeterminados.',
        true,
      );
    }
  }

  private crearFondoPersonalizado(id: string, url: string | null): FondoPersonalizado {
    return { id, nombre: 'Fondo personalizado', ruta: toBackgroundRoute(id), url };
  }


   // Selecciona un fondo predeterminado o personalizado y lo guarda en el perfil.

  seleccionarFondo(ruta: string): void {
    const anterior = this.fondoSeleccionado;
    if (ruta === anterior) return;

    this.fondoSeleccionado = ruta;
    void this.backgroundHandler.changeBackground(ruta);
    this.cdr.detectChanges();

    this.userFiles.saveSelectedBackground(ruta).subscribe({
      error: (error: unknown) => {
        console.error('Error al guardar el fondo seleccionado:', error);
        // Si no se pudo guardar, se regresa al fondo anterior.
        if (this.fondoSeleccionado === ruta) {
          this.fondoSeleccionado = anterior;
          void this.backgroundHandler.changeBackground(anterior);
        }
        this.mostrarMensaje(
          getFormErrorMessage(error) ?? 'No se pudo guardar el fondo seleccionado.',
          true,
        );
      },
    });
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
    const bloqueada = this.subiendoImagen || this.limiteAlcanzado;
    if (event.dataTransfer) event.dataTransfer.dropEffect = bloqueada ? 'none' : 'copy';
    this.arrastrando = !bloqueada;
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

    if (this.limiteAlcanzado) {
      this.descartarPendiente();
      this.mostrarMensaje(
        `Solo puedes tener ${this.MAX_FONDOS_PERSONALIZADOS} fondos personalizados. Elimina uno para subir otro.`,
        true,
      );
      return;
    }

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

  // Botón "Subir" de la vista previa: envía la imagen al backend, que la guarda en S3.
  confirmarSubida(): void {
    const archivo = this.archivoPendiente;
    if (!archivo || this.subiendoImagen) return;

    this.subiendoImagen = true;
    this.progresoSubida = 0;
    this.mostrarMensaje('Subiendo imagen...');

    this.subidaActual = this.userFiles.uploadBackground(archivo).subscribe({
      next: (event) => {
        const progreso = uploadProgress(event);
        if (progreso !== null) {
          this.progresoSubida = progreso;
          this.cdr.detectChanges();
          return;
        }

        if (event.type !== HttpEventType.Response || !event.body) return;

        // El backend deja seleccionado el fondo recién subido.
        const { backgroundId } = event.body;
        const ruta = toBackgroundRoute(backgroundId);

        const url = this.userFiles.cacheBackground(backgroundId, archivo);

        this.fondosPersonalizados = [
          this.crearFondoPersonalizado(backgroundId, url),
          ...this.fondosPersonalizados,
        ];
        this.fondoSeleccionado = ruta;
        void this.backgroundHandler.changeBackground(ruta);

        this.descartarPendiente();
        this.terminarSubida();
        this.mostrarMensaje('Imagen cargada correctamente.');
      },
      error: (error: unknown) => {
        console.error('Error al cargar la imagen:', error);
        this.terminarSubida();
        this.mostrarMensaje(getFileErrorMessage(error, 'No se pudo cargar la imagen.'), true);
      },
    });
  }

  // Botón "Cancelar": descarta la vista previa o detiene la subida en curso.
  cancelarSubida(): void {
    if (this.subidaActual) {
      // Cancelar la suscripción aborta la petición HTTP.
      this.subidaActual.unsubscribe();
      this.terminarSubida();
      this.mostrarMensaje('Subida cancelada.');
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

  private terminarSubida(): void {
    this.subidaActual = null;
    this.subiendoImagen = false;
    this.progresoSubida = 0;
    this.cdr.detectChanges();
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


   // Valida los formatos de imagen.

  private esImagenPermitida(archivo: File): boolean {
    return ALLOWED_IMAGE_TYPES.includes(archivo.type);
  }

   // Elimina un fondo personalizado de S3 usando su ID.

  eliminarFondoPersonalizado(id: string): void {
    const fondo = this.fondosPersonalizados.find(
      item => item.id === id
    );

    if (!fondo) {
      return;
    }

    const confirmar = window.confirm(
      '¿Deseas eliminar este fondo personalizado?'
    );

    if (!confirmar) {
      return;
    }

    this.userFiles.deleteBackground(id).subscribe({
      next: (user) => {
        this.fondosPersonalizados = this.fondosPersonalizados.filter(
          item => item.id !== id
        );

        // Si era el seleccionado, el backend regresa al fondo por defecto.
        if (this.fondoSeleccionado === fondo.ruta) {
          this.fondoSeleccionado = user.background || DEFAULT_BACKGROUND;
          void this.backgroundHandler.changeBackground(this.fondoSeleccionado);
        }

        this.mostrarMensaje('Fondo eliminado correctamente.');
      },
      error: (error: unknown) => {
        console.error('Error al eliminar el fondo:', error);
        this.mostrarMensaje(getFileErrorMessage(error, 'No se pudo eliminar el fondo.'), true);
      },
    });
  }

  ngOnDestroy(): void {
    this.subidaActual?.unsubscribe();

    if (this.vistaPreviaSubida) {
      URL.revokeObjectURL(
        this.vistaPreviaSubida
      );
    }
  }
}
