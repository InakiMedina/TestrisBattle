import { Component, OnInit, inject } from '@angular/core';
import { BackgroundHandler } from '../../../../../../services/background-handler'; // ajusta la ruta

@Component({
  selector: 'app-fondos',
  standalone: true,
  imports: [],
  templateUrl: './fondos.html',
  styleUrl: './fondos.scss',
})
export class Fondos implements OnInit {
  private backgroundHandler = inject(BackgroundHandler);

  fondos = [
    { nombre: 'Galaxia 1', ruta: '/backgrounds/city_image.jpg' },
    { nombre: 'Galaxia 2', ruta: '/backgrounds/bg_2.avif' },
    { nombre: 'Galaxia 3', ruta: '/backgrounds/bg_3.webp' },
    { nombre: 'Galaxia 4', ruta: '/backgrounds/bg_4.jpg' },
    { nombre: 'Galaxia 5', ruta: '/backgrounds/bg_5.jpg' },
    { nombre: 'Galaxia 6', ruta: '/backgrounds/bg_6.jpg' },
  ];

  fondoSeleccionado = localStorage.getItem('fondoSeleccionado') || '/backgrounds/city_image.jpg';

  ngOnInit(): void {
    const fondoGuardado = localStorage.getItem('fondoSeleccionado');

    if (
      fondoGuardado &&
      this.fondos.some((fondo) => fondo.ruta === fondoGuardado)
    ) {
      this.fondoSeleccionado = fondoGuardado;
    }

    this.backgroundHandler.changeBackground(this.fondoSeleccionado);
  }

  seleccionarFondo(ruta: string): void {
    this.fondoSeleccionado = ruta;
    localStorage.setItem('fondoSeleccionado', ruta);
    this.backgroundHandler.changeBackground(ruta);
  }
}