import { ChangeDetectorRef, Component, OnInit, computed, inject } from '@angular/core';
import { AuthService } from '../../../../../../core/auth/auth.service';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PROFILE_PICTURE_BYTES,
  UserFilesService,
  getFileErrorMessage,
} from '../../../../../../services/user-files.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly userFiles = inject(UserFilesService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Datos del usuario que inició sesión
  readonly nombreJugador = computed(() => this.auth.currentUser()?.username ?? '');
  readonly correo = computed(() => this.auth.currentUser()?.email ?? '');
  readonly elo = computed(() => this.auth.currentUser()?.elo ?? 0);

  readonly formatosPermitidos = ALLOWED_IMAGE_TYPES.join(',');

  // URL de la foto subida a S3; null muestra la imagen por defecto (SVG).
  imagenPerfil: string | null = null;
  procesandoImagen = false;

  ngOnInit(): void {
    void this.cargarImagenPerfil();
  }

  private async cargarImagenPerfil(): Promise<void> {
    try {
      this.imagenPerfil = await this.userFiles.getProfilePictureUrl();
    } catch (error) {
      console.error('Error al cargar la foto de perfil:', error);
      this.imagenPerfil = null;
    }
    this.cdr.detectChanges();
  }

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    // Limpiar el input para poder elegir de nuevo el mismo archivo.
    input.value = '';

    if (!archivo || this.procesandoImagen) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(archivo.type)) {
      alert('Formato no permitido. Usa PNG, JPG, WEBP, GIF, AVIF o BMP.');
      return;
    }

    if (archivo.size > MAX_PROFILE_PICTURE_BYTES) {
      alert('La imagen debe pesar menos de 2 MB.');
      return;
    }

    // Al subir una foto nueva, el backend elimina la anterior.
    this.procesandoImagen = true;
    this.userFiles.uploadProfilePicture(archivo).subscribe({
      next: () => void this.cargarImagenPerfil(),
      error: (error: unknown) => {
        this.procesandoImagen = false;
        alert(getFileErrorMessage(error, 'No se pudo guardar la foto de perfil.'));
        this.cdr.detectChanges();
      },
      complete: () => {
        this.procesandoImagen = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Elimina la foto subida y vuelve a la imagen por defecto de la aplicación.
  eliminarImagen(): void {
    if (!this.imagenPerfil || this.procesandoImagen) {
      return;
    }

    if (!window.confirm('¿Deseas eliminar tu foto de perfil?')) {
      return;
    }

    this.procesandoImagen = true;
    this.userFiles.deleteProfilePicture().subscribe({
      next: () => {
        this.imagenPerfil = null;
      },
      error: (error: unknown) => {
        this.procesandoImagen = false;
        alert(getFileErrorMessage(error, 'No se pudo eliminar la foto de perfil.'));
        this.cdr.detectChanges();
      },
      complete: () => {
        this.procesandoImagen = false;
        this.cdr.detectChanges();
      },
    });
  }
}
