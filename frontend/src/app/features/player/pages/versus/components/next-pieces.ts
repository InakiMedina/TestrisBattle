import { Component, input } from '@angular/core';
import type { PieceType } from '../../../../../../game/logic/TetrisEngine';

const PREVIEW_SHAPES: Record<PieceType, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

// Mismos colores que los cuadros de public/assets/pieces/pieces.png.
const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

/** Panel de las próximas piezas o identificador del rival. */
@Component({
  selector: 'app-next-pieces',
  standalone: true,
  template: `
    <section class="next-panel">
      <h3>{{ opponent() ? 'Rival' : 'Next' }}</h3>
      @if (opponent()) {
        <p class="panel-hint">{{ opponentName() ?? '—' }}</p>
      } @else if (showPieces()) {
        @for (type of pieces().slice(0, 3); track $index) {
          <div class="piece" [attr.aria-label]="'Pieza ' + type">
            @for (row of shapes[type]; track $index) {
              <div class="row">
                @for (filled of row; track $index) {
                  <span class="cell" [style.background]="filled ? colors[type] : 'transparent'"></span>
                }
              </div>
            }
          </div>
        }
      } @else {
        <p class="panel-hint">Inicia una partida</p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 0;
        width: 100%;
        min-width: 0;
        min-height: 0;
      }
      .next-panel {
        display: flex;
        flex: 1 1 0;
        flex-direction: column;
        align-items: center;
        width: 100%;
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
      .panel-hint {
        margin: 0;
        color: #d7d5e8;
        font-size: clamp(10px, 0.9vw, 14px);
        line-height: 1.5;
        text-align: center;
      }
      .piece {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 7px 0;
      }
      .row {
        display: flex;
      }
      .cell {
        width: 16px;
        height: 16px;
        margin: 1px;
        border-radius: 2px;
      }
      @media (max-width: 620px) {
        .next-panel {
          padding: 5px 3px;
        }
        h3 {
          font-size: 9px;
        }
      }
    `,
  ],
})
export class NextPieces {
  readonly pieces = input<PieceType[]>([]);
  readonly opponent = input(false);
  readonly opponentName = input<string | null>(null);
  readonly showPieces = input(false);
  protected readonly shapes = PREVIEW_SHAPES;
  protected readonly colors = PIECE_COLORS;
}
