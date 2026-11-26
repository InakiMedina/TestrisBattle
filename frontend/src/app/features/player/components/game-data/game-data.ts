import { Component, input } from '@angular/core';
import type { PlayerStats } from '@shared/types/realtime.types';
import type { Power } from '../../../../shared/interfaces/power-interface';
import { Dice } from '../dice/dice';

export type GameDataMode = 'practice' | 'player' | 'opponent';

@Component({
  selector: 'app-game-data',
  standalone: true,
  imports: [Dice],
  templateUrl: './game-data.html',
  styleUrl: './game-data.scss',
})
export class GameData {
  readonly mode = input<GameDataMode>('player');
  readonly stats = input<PlayerStats>({ score: 0, level: 0, lines: 0 });
  readonly high = input(0);
  readonly powers = input<Power[]>([]);
  readonly pointsToNextPower = input<number | null>(null);

  protected puntosSiguientePoder(score: number): number {
    const remainder = score % 1000;
    return remainder === 0 ? 1000 : 1000 - remainder;
  }
}
