import { Component, input, output } from '@angular/core';
import type { PlayerStats } from '@shared/types/realtime.types';
import type { Power } from '../../../../../shared/interfaces/power-interface';

@Component({
  selector: 'app-game-data',
  standalone: true,
  template: `
    <section class="score-panel">
      <h3>Score</h3>
      <div class="score-value">{{ stats().score }}</div>

      <div class="score-stat">
        <span>Level:</span>
        <strong>{{ stats().level }}</strong>
      </div>

      <div class="score-stat">
        <span>Lines:</span>
        <strong>{{ stats().lines }}</strong>
      </div>

      <div class="score-stat">
        <span>High:</span>
        <strong>{{ high() }}</strong>
      </div>

      <div class="next-power-label">Points for next power:</div>
      <div class="next-power-value">{{ puntosSiguientePoder(stats().score) }}</div>

      <div class="dice">
        @if (opponent()) {
          <img src="/dice/1.png" alt="Dado del rival" />
        } @else {
          <img
            [src]="diceImage()"
            [class.rolling]="animatingDice()"
            alt="Resultado de tu dado"
          />
        }
      </div>

      @if (opponent()) {
        <div class="random-power">
          <img src="/power/none.png" alt="Poder del rival" />
        </div>
      } @else {
        <button
          class="dice-button"
          type="button"
          (click)="rollDice.emit()"
          [disabled]="animatingDice()"
        >
          {{ animatingDice() ? 'Lanzando...' : 'Lanzar dado' }}
        </button>

        <div class="random-power">
          <img
            [src]="power()?.image ?? '/power/none.png'"
            [alt]="power()?.name ?? 'Sin poder seleccionado'"
          />
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 0 0 64%;
        width: 100%;
        min-width: 0;
        min-height: 0;
      }

      .score-panel {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 10px 8px;
        box-sizing: border-box;
        background: rgba(53, 51, 79, 0.96);
        border: 2px solid #fff;
        border-radius: 9px;
        backdrop-filter: blur(8px);
      }

      h3 {
        margin: 0 0 7px;
        text-align: center;
        font-size: clamp(10px, 0.8vw, 14px);
        font-weight: 400;
      }

      .score-value,
      .next-power-value {
        width: 100%;
        padding: 4px 2px;
        box-sizing: border-box;
        border-radius: 6px;
        background: #191820;
        color: #ff4545;
        text-align: center;
        font-family: monospace;
        font-size: clamp(9px, 0.72vw, 13px);
      }

      .score-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 5px;
        font-size: clamp(8px, 0.58vw, 10px);
      }

      .score-stat span {
        color: #fff;
      }

      .score-stat strong {
        display: block;
        width: 100%;
        padding: 3px 2px;
        box-sizing: border-box;
        border-radius: 5px;
        background: #191820;
        color: #e8ad00;
        text-align: center;
        font-family: monospace;
        font-weight: 400;
      }

      .next-power-label {
        margin-top: 8px;
        font-size: clamp(7px, 0.52vw, 9px);
        line-height: 1.2;
      }

      .next-power-value {
        color: #52e6a5;
        font-size: clamp(8px, 0.65vw, 11px);
      }

      .dice {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        margin: 10px auto;
      }

      .dice img {
        display: block;
        width: 100%;
        height: 100%;
        padding: 3px;
        box-sizing: border-box;
        object-fit: contain;
        transition: transform 0.1s ease;
      }

      .dice img.rolling {
        animation: dice-shake 0.12s ease-in-out infinite alternate;
      }

      .dice-button {
        display: block;
        width: 65%;
        max-width: 120px;
        min-width: 90px;
        box-sizing: border-box;
        margin: 5px auto 20px;
        padding: 8px 5px;
        color: #fff;
        background: #191820;
        border: 1px solid #24d5d8;
        border-radius: 6px;
        font-size: clamp(8px, 0.65vw, 11px);
        white-space: nowrap;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .dice-button:hover:not(:disabled) {
        background: #24d5d8;
        color: #191820;
      }

      .dice-button:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .random-power {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        min-height: 76px;
        margin: 0 auto;
        padding: 5px;
        box-sizing: border-box;
        border-radius: 8px;
        background: #191820;
      }

      .random-power img {
        width: 100%;
        max-width: 60px;
        height: 60px;
        object-fit: contain;
      }

      @keyframes dice-shake {
        0% {
          transform: scale(0.88) rotate(-8deg);
        }

        100% {
          transform: scale(1.12) rotate(8deg);
        }
      }

      @media (max-width: 900px) {
        .score-panel {
          padding: 6px 4px;
        }
      }

      @media (max-width: 620px) {
        .score-panel {
          padding: 5px 3px;
        }

        h3 {
          font-size: 9px;
        }

        .next-power-label {
          font-size: 6px;
        }

        .score-stat {
          font-size: 7px;
        }

        .dice-button {
          margin-bottom: 8px;
          padding: 5px 1px;
          font-size: 6px;
        }

        .random-power {
          min-height: 42px;
        }

        .random-power img {
          height: 38px;
        }
      }
    `,
  ],
})
export class GameData {
  readonly opponent = input(false);
  readonly stats = input<PlayerStats>({ score: 0, level: 0, lines: 0 });
  readonly high = input(0);
  readonly diceImage = input('/dice/1.png');
  readonly animatingDice = input(false);
  readonly power = input<Power | null>(null);
  readonly rollDice = output<void>();

  protected puntosSiguientePoder(score: number): number {
    const remainder = score % 1000;
    return remainder === 0 ? 1000 : 1000 - remainder;
  }
}
