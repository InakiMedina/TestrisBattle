import { Component, OnDestroy, input, signal } from '@angular/core';
import type { Power } from '../../../../shared/interfaces/power-interface';

@Component({
  selector: 'app-dice',
  standalone: true,
  templateUrl: './dice.html',
  styleUrl: './dice.scss',
})
export class Dice implements OnDestroy {
  readonly powers = input<Power[]>([]);
  readonly opponent = input(false);

  protected readonly face = signal(0);
  protected readonly selectedPower = signal<Power | null>(null);
  protected readonly animating = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  roll(): void {
    if (this.animating()) return;

    const finalFace = Math.floor(Math.random() * 6) + 1;
    const speeds = [35, 35, 40, 40, 45, 50, 60, 70, 85, 105, 130, 160];
    let step = 0;

    if (this.timer) clearTimeout(this.timer);
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

  protected image(): string {
    const face = this.face();
    return face === 0 ? '/dice/1.png' : `/dice/${face}.png`;
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
