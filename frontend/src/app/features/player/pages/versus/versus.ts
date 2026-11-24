import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import type { PlayerStats } from '@shared/types/realtime.types';
import { OFFLINE_MESSAGE } from '../../../../core/realtime/realtime.service';
import { Power } from '../../../../shared/interfaces/power-interface';
import { PhaserGame } from '../../../../phaser-game.component';
import type { PieceType } from '../../../../../game/logic/TetrisEngine';
import { NextPieces } from './components/next-pieces';
import { VersusStore } from './versus.store';

const REASON_LABELS = {
  'topped-out': 'tablero lleno',
  forfeit: 'abandono',
  disconnected: 'desconexión',
} as const;

@Component({
  selector: 'app-versus',
  standalone: true,
  imports: [PhaserGame, NextPieces],
  // El store vive y muere con la vista: sus listeners se limpian al salir.
  providers: [VersusStore],
  templateUrl: './versus.html',
  styleUrl: './versus.scss',
})
export class Versus implements OnDestroy {
  protected readonly store = inject(VersusStore);
  protected readonly offlineMessage = OFFLINE_MESSAGE;
  protected readonly reasonLabels = REASON_LABELS;

  protected readonly nextPieces = signal<PieceType[]>([]);

  // Datos mostrados en cada panel
  protected readonly myStats = this.store.myStats;
  protected readonly opponentStats = computed<PlayerStats>(
    () => this.store.opponent()?.stats ?? { score: 0, level: 0, lines: 0 },
  );
  protected readonly myHigh = computed(() => this.store.me()?.high ?? 0);
  protected readonly opponentHigh = computed(() => this.store.opponent()?.high ?? 0);

  /** El tablero se muestra desde la cuenta regresiva hasta el resultado. */
  protected readonly showBoard = computed(() => {
    const phase = this.store.phase();
    return phase === 'countdown' || phase === 'playing' || phase === 'finished';
  });

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

  readonly todosLosPoderes: Power[] = [...this.poderesIzquierda, ...this.poderesDerecha];

  // Dado del jugador local (los poderes se conectarán al rival en la siguiente entrega)
  protected readonly caraDado = signal(0);
  protected readonly poder = signal<Power | null>(null);
  protected readonly animandoDado = signal(false);
  private timerDado: ReturnType<typeof setTimeout> | null = null;

  /** Calcula los puntos que faltan para el siguiente poder. */
  puntosSiguientePoder(score: number): number {
    const remainder = score % 1000;
    return remainder === 0 ? 1000 : 1000 - remainder;
  }

  lanzarDado(): void {
    if (this.animandoDado()) return;

    const caraFinal = Math.floor(Math.random() * 6) + 1;
    const velocidades = [35, 35, 40, 40, 45, 50, 60, 70, 85, 105, 130, 160];
    let paso = 0;

    if (this.timerDado) clearTimeout(this.timerDado);
    this.animandoDado.set(true);

    const animar = () => {
      if (paso >= velocidades.length) {
        // Mostrar resultado final.
        this.caraDado.set(caraFinal);
        this.poder.set(this.todosLosPoderes[caraFinal - 1] ?? null);
        this.animandoDado.set(false);
        this.timerDado = null;
        return;
      }

      // Recorrer las caras 1, 2, 3, 4, 5 y 6.
      this.caraDado.set((paso % 6) + 1);
      const velocidad = velocidades[paso]!;
      paso++;
      this.timerDado = setTimeout(animar, velocidad);
    };

    animar();
  }

  /** Devuelve la imagen correspondiente a la cara actual. */
  imagenDado(): string {
    const cara = this.caraDado();
    return cara === 0 ? '/dice/1.png' : `/dice/${cara}.png`;
  }

  /** Limpia los temporizadores al destruir el componente. */
  ngOnDestroy(): void {
    if (this.timerDado) clearTimeout(this.timerDado);
  }
}
