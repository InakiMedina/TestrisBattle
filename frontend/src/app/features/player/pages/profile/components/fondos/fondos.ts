
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

  private vistaPreviaSubida: string | null = null;

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

  
   // Sube y guarda una imagen personalizada.
  async seleccionarImagen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    const id = crypto.randomUUID();
    const clave = `custom-background:${id}`;

    this.subiendoImagen = true;
    this.progresoSubida = 0;
    this.mensajeImagen = 'Cargando imagen...';

    try {
      // 1. Mostrar y completar la barra
      this.progresoSubida = 30;
      this.cdr.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 300));

      this.progresoSubida = 70;
      this.cdr.detectChanges();

      // 2. Guardar la imagen
      await this.imageStorage.save(clave, archivo);

      this.progresoSubida = 100;
      this.cdr.detectChanges();

      // 3. Esperar un momento para que se vea completa
      await new Promise(resolve => setTimeout(resolve, 800));

      // 4. Crear la miniatura cuando la barra esté completa
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

      // 5. Actualizar el fondo del juego
      await this.backgroundHandler.changeBackground(`custom:${id}`);

      this.mensajeImagen = 'Imagen cargada correctamente.';
    } catch (error) {
      console.error('Error al cargar la imagen:', error);
      this.mensajeImagen = 'No se pudo cargar la imagen.';
    } finally {
      await new Promise(resolve => setTimeout(resolve, 800));

      this.subiendoImagen = false;
      this.cdr.detectChanges();

      input.value = '';
    }
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
    if (this.vistaPreviaSubida) {
      URL.revokeObjectURL(
        this.vistaPreviaSubida
      );
    }
  }
}
