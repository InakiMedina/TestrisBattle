import { Component, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Power } from '../../../../shared/interfaces/power-interface';
import { VersusPlayerData } from '../../../../shared/interfaces/versus-player-data';

@Component({
  selector: 'app-versus',
  standalone: true,
  imports: [],
  templateUrl: './versus.html',
  styleUrl: './versus.scss',
})
export class Versus implements OnDestroy {

  constructor(private cdr: ChangeDetectorRef) {}

  @Input() player1Data: Partial<VersusPlayerData> | null = null;
  @Input() player2Data: Partial<VersusPlayerData> | null = null;

  readonly initialPlayerData: VersusPlayerData = {
    score: 0,
    level: 0,
    lines: 0,
    high: 0,
  };

  // Poderes disponibles
  readonly poderesIzquierda: Power[] = [
    {
      id: 'push',
      name: 'Push',
      image: '/power/push.png',
      description: 'Permite alterar la posición de las piezas del oponente.',
    },
    {
      id: 'shuffle',
      name: 'Shuffle',
      image: '/power/shuffle.png',
      description: 'Modifica aleatoriamente la pila de piezas que recibirá el oponente.',
    },
    {
      id: 'block',
      name: 'Block',
      image: '/power/block.png',
      description: 'Genera un obstáculo que dificulta el juego del oponente.',
    },
  ];

  readonly poderesDerecha: Power[] = [
    {
      id: 'gravity-minus',
      name: 'Gravity -',
      image: '/power/gravity-.png',
      description: 'Disminuye temporalmente la velocidad con la que caen las piezas del oponente.',
    },
    {
      id: 'gravity-plus',
      name: 'Gravity +',
      image: '/power/gravity+.png',
      description: 'Aumenta temporalmente la velocidad con la que caen las piezas del oponente.',
    },
    {
      id: 'chaos',
      name: 'Chaos',
      image: '/power/chaos.png',
      description: 'Provoca una alteración especial en el tablero del oponente.',
    },
  ];

  readonly todosLosPoderes: Power[] = [
    ...this.poderesIzquierda,
    ...this.poderesDerecha,
  ];

  // Estado de los dados
  caraDadoJugador1 = 0;
  caraDadoJugador2 = 0;

  poderJugador1: Power | null = null;
  poderJugador2: Power | null = null;

  // Estado de las animaciones
  animandoDadoJugador1 = false;
  animandoDadoJugador2 = false;

  private timerDadoJugador1: ReturnType<typeof setTimeout> | null = null;
  private timerDadoJugador2: ReturnType<typeof setTimeout> | null = null;

  // Estado de los jugadores
  jugador1Listo = false;
  jugador2Listo = false;

  get ambosListos(): boolean {
    return this.jugador1Listo && this.jugador2Listo;
  }

  // Datos jugador 1
  get scoreJugador1(): number {
    return this.player1Data?.score ?? this.initialPlayerData.score;
  }

  get nivelJugador1(): number {
    return this.player1Data?.level ?? this.initialPlayerData.level;
  }

  get lineasJugador1(): number {
    return this.player1Data?.lines ?? this.initialPlayerData.lines;
  }

  get recordJugador1(): number {
    return this.player1Data?.high ?? this.initialPlayerData.high;
  }

  // Datos jugador 2
  get scoreJugador2(): number {
    return this.player2Data?.score ?? this.initialPlayerData.score;
  }

  get nivelJugador2(): number {
    return this.player2Data?.level ?? this.initialPlayerData.level;
  }

  get lineasJugador2(): number {
    return this.player2Data?.lines ?? this.initialPlayerData.lines;
  }

  get recordJugador2(): number {
    return this.player2Data?.high ?? this.initialPlayerData.high;
  }

  /** Calcula los puntos que faltan para el siguiente poder. */
  puntosSiguientePoder(score: number): number {
    const remainder = score % 1000;
    return remainder === 0 ? 1000 : 1000 - remainder;
  }

  /** Marca a cada jugador como listo. */
  prepararJugador(jugador: 1 | 2): void {
    if (jugador === 1) {
      this.jugador1Listo = true;
    } else {
      this.jugador2Listo = true;
    }
  }

  /** Obtiene una cara aleatoria diferente a la anterior. */
  private obtenerCaraAleatoria(caraActual: number): number {
    let nuevaCara: number;

    do {
      nuevaCara = Math.floor(Math.random() * 6) + 1;
    } while (nuevaCara === caraActual);

    return nuevaCara;
  }

  lanzarDado(jugador: 1 | 2): void {
    if (jugador === 1 && this.animandoDadoJugador1) return;
    if (jugador === 2 && this.animandoDadoJugador2) return;

    const caraFinal = Math.floor(Math.random() * 6) + 1;

    const velocidades = [
      35, 35, 40, 40, 45, 50,
      60, 70, 85, 105, 130, 160
    ];

    let paso = 0;

    if (jugador === 1) {
      if (this.timerDadoJugador1) {
        clearTimeout(this.timerDadoJugador1);
      }

      this.animandoDadoJugador1 = true;
    } else {
      if (this.timerDadoJugador2) {
        clearTimeout(this.timerDadoJugador2);
      }

      this.animandoDadoJugador2 = true;
    }

    this.cdr.detectChanges();

    const animar = () => {
      if (paso >= velocidades.length) {
        // Mostrar resultado final.
        if (jugador === 1) {
          this.caraDadoJugador1 = caraFinal;
          this.poderJugador1 = this.todosLosPoderes[caraFinal - 1];

          this.animandoDadoJugador1 = false;
          this.timerDadoJugador1 = null;
        } else {
          this.caraDadoJugador2 = caraFinal;
          this.poderJugador2 = this.todosLosPoderes[caraFinal - 1];

          this.animandoDadoJugador2 = false;
          this.timerDadoJugador2 = null;
        }

        this.cdr.detectChanges();
        return;
      }

      // Recorrer las caras 1, 2, 3, 4, 5 y 6.
      const nuevaCara = (paso % 6) + 1;

      if (jugador === 1) {
        this.caraDadoJugador1 = nuevaCara;
      } else {
        this.caraDadoJugador2 = nuevaCara;
      }

      this.cdr.detectChanges();

      const velocidad = velocidades[paso];
      paso++;

      const timer = setTimeout(animar, velocidad);

      if (jugador === 1) {
        this.timerDadoJugador1 = timer;
      } else {
        this.timerDadoJugador2 = timer;
      }
    };

    animar();
  }

  /** Devuelve la imagen correspondiente a la cara actual. */
  imagenDado(jugador: 1 | 2): string {
    const cara = jugador === 1
      ? this.caraDadoJugador1
      : this.caraDadoJugador2;

    return cara === 0 ? '/dice/1.png' : `/dice/${cara}.png`;
  }

  /** Limpia los temporizadores al destruir el componente. */
  ngOnDestroy(): void {
    if (this.timerDadoJugador1) {
      clearTimeout(this.timerDadoJugador1);
    }

    if (this.timerDadoJugador2) {
      clearTimeout(this.timerDadoJugador2);
    }
  }
}
