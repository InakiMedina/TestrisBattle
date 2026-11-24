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

/** Vista previa de las siguientes piezas del tablero local. */
@Component({
  selector: 'app-next-pieces',
  template: `
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
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        width: 100%;
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
    `,
  ],
})
export class NextPieces {
  readonly pieces = input<PieceType[]>([]);
  protected readonly shapes = PREVIEW_SHAPES;
  protected readonly colors = PIECE_COLORS;
}
