
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  nombreReal = 'Lilia Padilla';
  nombreJugador = 'LiliaLag';
  correo = 'lilia@email.com';
  elo = 'Plata';

  editandoNombreReal = false;

  imagenPerfil: string | null = null;

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

    if (this.imagenPerfil) {
      URL.revokeObjectURL(this.imagenPerfil);
    }

    this.imagenPerfil = URL.createObjectURL(archivo);
  }
}
