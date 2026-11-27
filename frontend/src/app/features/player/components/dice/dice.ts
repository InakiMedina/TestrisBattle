import { Component, OnDestroy, input, output, signal } from '@angular/core';
import type { Power } from '../../../../shared/interfaces/power-interface';

const PIPS_BY_FACE: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

@Component({
  selector: 'app-dice',
  standalone: true,
  templateUrl: './dice.html',
  styleUrl: './dice.scss',
})
export class Dice implements OnDestroy {
  readonly powers = input<Power[]>([]);
  readonly opponent = input(false);
  readonly canRoll = input(false); 
  readonly rollStarted = output<void>();

  protected readonly face = signal(0);
  protected readonly selectedPower = signal<Power | null>(null);
  protected readonly animating = signal(false);
  protected readonly pipPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  private timer: ReturnType<typeof setTimeout> | null = null;

  roll(): void {
    if (this.animating() || !this.canRoll()) return;

    const finalFace = Math.floor(Math.random() * 6) + 1;
    const speeds = [35, 35, 40, 40, 45, 50, 60, 70, 85, 105, 130, 160];
    let step = 0;

    if (this.timer) clearTimeout(this.timer);
    this.rollStarted.emit();
    this.animating.set(true);

    const animate = () => {
      if (step >= speeds.length) {
        this.face.set(finalFace);
        this.selectedPower.set(this.powers()[finalFace - 1] ?? null);
        this.animating.set(false);
        this.timer = null;
        return;
      }

      this.face.set((step % 6) + 1);
      const speed = speeds[step]!;
      step++;
      this.timer = setTimeout(animate, speed);
    };

    animate();
  }

  protected hasPip(position: number): boolean {
    return (PIPS_BY_FACE[this.face() || 1] ?? []).includes(position);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
