
import { Component } from '@angular/core';

interface JugadorRanking {
  posicion: number;
  nombre: string;
  puntaje: number;
  rango: string;
  imagenCopa?: string;
}

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {
  jugadores: JugadorRanking[] = [
    { posicion: 1, nombre: 'NovaX', puntaje: 2450, rango: 'Diamante' },
    { posicion: 2, nombre: 'PixelStorm', puntaje: 2310, rango: 'Diamante' },
    { posicion: 3, nombre: 'TetrisKing', puntaje: 2180, rango: 'Platino' },
    { posicion: 4, nombre: 'GalaxyPro', puntaje: 2050, rango: 'Platino' },
    { posicion: 5, nombre: 'BlockMaster', puntaje: 1920, rango: 'Oro' },
  ];

  ngOnInit(): void {
    this.jugadores.sort((a, b) => b.puntaje - a.puntaje);

    this.jugadores.forEach((jugador, indice) => {
      jugador.posicion = indice + 1;
    });
  }

  obtenerCopa(posicion: number): string {
    return '/copa/copa.png';
  }
  
}
