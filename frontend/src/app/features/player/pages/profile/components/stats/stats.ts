
import { Component } from '@angular/core';

interface Partida {
  rival: string;
  resultado: 'Victoria' | 'Derrota';
  puntos: number;
  fecha: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {
  eloActual = 2450;
  lineas = 30000;
  poderes = 30;

  mejoresPartidas: Partida[] = [
    {
      rival: 'PixelStorm',
      resultado: 'Victoria',
      puntos: 3200,
      fecha: '15/10/2026',
    },
    {
      rival: 'TetrisKing',
      resultado: 'Victoria',
      puntos: 2950,
      fecha: '12/10/2026',
    },
    {
      rival: 'GalaxyPro',
      resultado: 'Derrota',
      puntos: 2780,
      fecha: '10/10/2026',
    },
  ];

  obtenerPartidasPorPosicion(): Partida[] {
    return [...this.mejoresPartidas]
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 3);
  }
}
