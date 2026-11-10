
import { Component } from '@angular/core';

import {
  PoderRanking,
  MejorPartida,
  VistaRanking
} from '../../../../../../shared/interfaces/ranking-interface';


@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {

  vistaActiva: VistaRanking = 'puntos';

  mejoresPartidas: MejorPartida[] = [
    {
      posicion: 1,
      rival: 'BlockDropper99',
      puntaje: 74300,
      fecha: '2026-10-17'
    },
    {
      posicion: 2,
      rival: 'T-Spin_Wizard',
      puntaje: 58400,
      fecha: '2026-10-18'
    },
    {
      posicion: 3,
      rival: 'TacoDeAsada',
      puntaje: 51200,
      fecha: '2026-10-16'
    }
  ];

  poderesMasUsados: PoderRanking[] = [
    {
      id: 'chaos',
      name: 'Chaos',
      description: 'Altera las condiciones de juego del oponente.',
      image: '/power/chaos.png',
      posicion: 1,
      usos: 45
    },
    {
      id: 'shuffle',
      name: 'Shuffle',
      description: 'Mezcla las piezas del oponente.',
      image: '/power/shuffle.png',
      posicion: 2,
      usos: 32
    },
    {
      id: 'gravity-plus',
      name: 'Gravity +',
      description: 'Aumenta la velocidad de caída.',
      image: '/power/gravity+.png',
      posicion: 3,
      usos: 28
    }
  ];

  cambiarVista(vista: VistaRanking): void {
    this.vistaActiva = vista;
  }

  obtenerCopa(): string {
    return '/elements/copa.png';
  }
}
