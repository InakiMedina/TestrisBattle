import { Component, input } from '@angular/core';
import {
  PIECE_COLORS,
  PIECE_PREVIEW_SHAPES,
  type PieceType,
} from '../../../../../game/logic/piece-data';

@Component({
  selector: 'app-next-pieces',
  standalone: true,
  templateUrl: './next-pieces.html',
  styleUrl: './next-pieces.scss',
})
export class NextPieces {
  readonly pieces = input<PieceType[]>([]);
  readonly opponent = input(false);
  readonly opponentName = input<string | null>(null);
  readonly showPieces = input(false);
  protected readonly shapes = PIECE_PREVIEW_SHAPES;
  protected readonly colors = PIECE_COLORS;
}
