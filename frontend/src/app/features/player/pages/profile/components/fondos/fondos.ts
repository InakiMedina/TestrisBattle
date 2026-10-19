
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fondos',
  standalone: true,
  imports: [],
  templateUrl: './fondos.html',
  styleUrl: './fondos.scss',
})
export class Fondos implements OnInit {

  fondos = [
      { nombre: 'Galaxia 1', ruta: '/fondos/1.jpg' },
      { nombre: 'Galaxia 2', ruta: '/fondos/2.avif' },
      { nombre: 'Galaxia 3', ruta: '/fondos/3.webp' },
      { nombre: 'Galaxia 4', ruta: '/fondos/4.jpg' },
      { nombre: 'Galaxia 5', ruta: '/fondos/5.jpg' },
      { nombre: 'Galaxia 6', ruta: '/fondos/6.jpg' },
    ];

  fondoSeleccionado = '/fondos/1.jpg';

  ngOnInit(): void {
    const fondoGuardado = localStorage.getItem('fondoSeleccionado');

    if (
      fondoGuardado &&
      this.fondos.some((fondo) => fondo.ruta === fondoGuardado)
    ) {
      this.fondoSeleccionado = fondoGuardado;
    }

    this.aplicarFondo(this.fondoSeleccionado);
  }

  seleccionarFondo(ruta: string): void {
    this.fondoSeleccionado = ruta;
    localStorage.setItem('fondoSeleccionado', ruta);
    this.aplicarFondo(ruta);
  }

  aplicarFondo(ruta: string): void {
    document.body.style.backgroundImage = `url("${ruta}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
  }
}
