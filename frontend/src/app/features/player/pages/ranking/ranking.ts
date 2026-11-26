
import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import {
  getLeagueByElo
} from '../../../../../../../shared/constants/league.constants';

interface PlayerData {
  username: string;
  elo: number;
}

interface RankedPlayer {
  username: string;
  elo: number;
  ranking: string;
  posicion: number;
  esJugadorActual: boolean;
}

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss'
})
export class Ranking {

  // Usuario actual de ejemplo
  readonly usernameActual = 'Player16';


  // JUGADORES DE EJEMPLO

  readonly jugadoresData: PlayerData[] = [
    { username: 'Player01', elo: 3200 },
    { username: 'Player02', elo: 2900 },
    { username: 'Player03', elo: 2700 },
    { username: 'Player04', elo: 2600 },
    { username: 'Player05', elo: 2500 },
    { username: 'Player06', elo: 2400 },
    { username: 'Player07', elo: 2350 },
    { username: 'Player08', elo: 2300 },
    { username: 'Player09', elo: 2250 },
    { username: 'Player10', elo: 2200 },
    { username: 'Player11', elo: 2150 },
    { username: 'Player12', elo: 2100 },
    { username: 'Player13', elo: 2050 },
    { username: 'Player14', elo: 2000 },
    { username: 'Player15', elo: 1950 },
    { username: 'Player16', elo: 1900 },
    { username: 'Player17', elo: 1850 },
    { username: 'Player18', elo: 1800 },
    { username: 'Player19', elo: 1750 },
    { username: 'Player20', elo: 1700 },
    { username: 'Player21', elo: 1650 },
    { username: 'Player22', elo: 1600 },
    { username: 'Player23', elo: 1550 },
    { username: 'Player24', elo: 1500 },
    { username: 'Player25', elo: 1450 },
    { username: 'Player26', elo: 1400 },
    { username: 'Player27', elo: 1350 },
    { username: 'Player28', elo: 1300 },
    { username: 'Player29', elo: 1250 },
    { username: 'Player30', elo: 1200 }
  ];


  // LISTA COMPLETA ORDENADA POR ELO

  readonly jugadores: RankedPlayer[] = this.jugadoresData
    .map(jugador => ({
      username: jugador.username,
      elo: jugador.elo,
      ranking: getLeagueByElo(jugador.elo).name,
      posicion: 0,
      esJugadorActual:
        jugador.username === this.usernameActual
    }))
    .sort((a, b) => b.elo - a.elo)
    .map((jugador, index) => ({
      ...jugador,
      posicion: index + 1
    }));


  // TOP 5 MUNDIAL

  readonly topMundial = this.jugadores
    .slice(0, 5)
    .sort((a, b) => {
      const ordenVisual = [4, 2, 1, 3, 5];

      return ordenVisual.indexOf(a.posicion) -
            ordenVisual.indexOf(b.posicion);
  });


  // TU POSICIÓN GLOBAL

  readonly posicionJugador: RankedPlayer[] =
    this.obtenerPosicionJugador();

  obtenerPosicionJugador(): RankedPlayer[] {
    const indiceJugador = this.jugadores.findIndex(
      jugador =>
        jugador.username === this.usernameActual
    );

    // Si no se encuentra el jugador
    if (indiceJugador === -1) {
      return [];
    }

    // Dos jugadores antes
    const inicio = Math.max(0, indiceJugador - 2);

    // Dos jugadores después
    const fin = Math.min(
      this.jugadores.length,
      indiceJugador + 3
    );

    return this.jugadores.slice(inicio, fin);
  }


  // LEADERBOARD
  readonly jugadoresPorPagina = 15;

  paginaActual = 1;

  get totalPaginas(): number {
    return Math.ceil(
      this.jugadores.length / this.jugadoresPorPagina
    );
  }

  get paginas(): number[] {
    return Array.from(
      { length: this.totalPaginas },
      (_, index) => index + 1
    );
  }

  get leaderboard(): RankedPlayer[] {
    const inicio =
      (this.paginaActual - 1) * this.jugadoresPorPagina;

    const fin =
      inicio + this.jugadoresPorPagina;

    return this.jugadores.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
  }

 
  // IMAGEN DE LA COPA

  obtenerCopa(): string {
    return '/elements/copa.png';
  }

}
