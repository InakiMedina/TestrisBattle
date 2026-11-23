import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  nombreReal = 'Lilia Padilla';
  nombreJugador = 'LiliaLag';
  correo = 'lilia@email.com';
  elo = 'Plata';

  editandoNombreReal = false;

  imagenPerfil: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Recuperar la imagen guardada al entrar al perfil
    this.imagenPerfil = localStorage.getItem('profile-image');
  }

  guardarNombreReal(): void {
    this.nombreReal = this.nombreReal.trim();

    if (!this.nombreReal) {
      this.nombreReal = 'Jugador';
    }

    this.editandoNombreReal = false;
  }

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      input.value = '';
      alert('La imagen debe pesar menos de 2 MB.');
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      const imagen = lector.result as string;

      try {
        localStorage.setItem('profile-image', imagen);

        this.imagenPerfil = imagen;

        // Forzar actualización de la vista
        this.cdr.detectChanges();
      } catch {
        alert('No se pudo guardar la imagen. Intenta con una más pequeña.');
      }
    };

    lector.readAsDataURL(archivo);
  }
}