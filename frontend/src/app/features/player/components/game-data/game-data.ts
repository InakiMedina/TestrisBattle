import { Component, computed, effect, input, signal } from '@angular/core';
import type { PlayerStats } from '@shared/types/realtime.types';
import type { Power } from '../../../../shared/interfaces/power-interface';
import { Dice } from '../dice/dice';

export type GameDataMode = 'practice' | 'player' | 'opponent';

const POINTS_REQUIRED_FOR_POWER = 1000;

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

  protected readonly currentPowerPoints = signal(0);
  private previousScore: number | null = null;

  constructor() {
    effect(() => {
      const score = this.stats().score;
      const previousScore = this.previousScore;
      this.previousScore = score;

      if (previousScore === null || score < previousScore) {
        this.currentPowerPoints.set(score);
      } else if (score > previousScore) {
        this.currentPowerPoints.update((points) => points + score - previousScore);
      }
    });
  }

  protected puntosSiguientePoder(): number {
    return Math.max(0, POINTS_REQUIRED_FOR_POWER - this.currentPowerPoints());
  }

  protected spendPowerPoints(): void {
    if (this.currentPowerPoints() < POINTS_REQUIRED_FOR_POWER) return;
    this.currentPowerPoints.set(0);
  }

  protected readonly canRoll = computed(
    () => this.currentPowerPoints() >= POINTS_REQUIRED_FOR_POWER,
  );
}
