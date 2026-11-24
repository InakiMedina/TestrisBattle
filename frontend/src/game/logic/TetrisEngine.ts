import type { PlayerStats } from '@shared/types/realtime.types';

// Reglas de Tetris (tablero, piezas, colisiones, líneas, niveles y puntaje),
// independientes de Phaser y de Angular. La escena Game de Phaser las usa para
// dibujar el tablero; así las reglas se pueden probar y reutilizar por separado.

export const COLS = 10;
export const ROWS = 20;

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Cell = PieceType | null;
type Matrix = number[][];

export interface ActivePiece {
  type: PieceType;
  matrix: Matrix;
  x: number;
  y: number;
}

const SHAPES: Record<PieceType, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const PIECE_TYPES = Object.keys(SHAPES) as PieceType[];

/** Puntos por líneas eliminadas a la vez (se multiplican por nivel + 1). */
const LINE_POINTS = [0, 100, 300, 500, 800];
const LINES_PER_LEVEL = 10;
const LOCK_DELAY_MS = 500;
const PREVIEW_SIZE = 3;

/** Milisegundos entre cada caída automática según el nivel. */
export function gravityInterval(level: number): number {
  return Math.max(80, 800 - level * 70);
}

function rotateClockwise(matrix: Matrix): Matrix {
  const size = matrix.length;
  return matrix.map((row, y) => row.map((_, x) => matrix[size - 1 - x]![y]!));
}

function rotateCounterClockwise(matrix: Matrix): Matrix {
  const size = matrix.length;
  return matrix.map((row, y) => row.map((_, x) => matrix[x]![size - 1 - y]!));
}

export class TetrisEngine {
  readonly board: Cell[][] = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
  current: ActivePiece | null = null;
  stats: PlayerStats;
  isOver = false;

  private readonly queue: PieceType[] = [];
  private gravityElapsed = 0;
  private lockElapsed = 0;

  constructor(initial: Partial<PlayerStats> = {}) {
    this.stats = {
      score: initial.score ?? 0,
      lines: initial.lines ?? 0,
      level: initial.level ?? Math.floor((initial.lines ?? 0) / LINES_PER_LEVEL),
    };
    this.spawn();
  }

  /** Próximas piezas para la vista previa. */
  get nextPieces(): PieceType[] {
    this.fillQueue();
    return this.queue.slice(0, PREVIEW_SIZE);
  }

  /** Posición vertical de la "sombra" de la pieza actual. */
  get ghostY(): number {
    const piece = this.current;
    if (!piece) return 0;
    let y = piece.y;
    while (this.fits(piece.matrix, piece.x, y + 1)) y++;
    return y;
  }

  /** Avanza el juego `deltaMs` milisegundos (gravedad y fijado de piezas). */
  tick(deltaMs: number): void {
    if (this.isOver || !this.current) return;

    if (this.isGrounded()) {
      this.lockElapsed += deltaMs;
      if (this.lockElapsed >= LOCK_DELAY_MS) this.lock();
      return;
    }

    this.gravityElapsed += deltaMs;
    const interval = gravityInterval(this.stats.level);
    while (this.gravityElapsed >= interval && !this.isGrounded()) {
      this.gravityElapsed -= interval;
      this.current.y++;
    }
  }

  moveLeft(): void {
    this.shift(-1);
  }

  moveRight(): void {
    this.shift(1);
  }

  /** Baja una fila (1 punto). */
  softDrop(): void {
    const piece = this.current;
    if (this.isOver || !piece) return;
    if (this.fits(piece.matrix, piece.x, piece.y + 1)) {
      piece.y++;
      this.stats = { ...this.stats, score: this.stats.score + 1 };
      this.gravityElapsed = 0;
    }
  }

  /** Deja caer la pieza hasta el fondo (2 puntos por fila). */
  hardDrop(): void {
    const piece = this.current;
    if (this.isOver || !piece) return;
    const target = this.ghostY;
    const distance = target - piece.y;
    piece.y = target;
    this.stats = { ...this.stats, score: this.stats.score + distance * 2 };
    this.lock();
  }

  rotate(direction: 1 | -1 = 1): void {
    const piece = this.current;
    if (this.isOver || !piece || piece.type === 'O') return;
    const rotated = direction === 1 ? rotateClockwise(piece.matrix) : rotateCounterClockwise(piece.matrix);

    // "Wall kicks" sencillos: si no cabe, se prueba moverla un poco.
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]] as const) {
      if (this.fits(rotated, piece.x + dx, piece.y + dy)) {
        piece.matrix = rotated;
        piece.x += dx;
        piece.y += dy;
        this.lockElapsed = 0;
        return;
      }
    }
  }

  private shift(dx: number): void {
    const piece = this.current;
    if (this.isOver || !piece) return;
    if (this.fits(piece.matrix, piece.x + dx, piece.y)) {
      piece.x += dx;
      this.lockElapsed = 0;
    }
  }

  private isGrounded(): boolean {
    const piece = this.current;
    return !!piece && !this.fits(piece.matrix, piece.x, piece.y + 1);
  }

  private fits(matrix: Matrix, x: number, y: number): boolean {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row]!.length; col++) {
        if (!matrix[row]![col]) continue;
        const boardX = x + col;
        const boardY = y + row;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
        if (boardY >= 0 && this.board[boardY]![boardX]) return false;
      }
    }
    return true;
  }

  private lock(): void {
    const piece = this.current;
    if (!piece) return;

    piece.matrix.forEach((row, r) =>
      row.forEach((filled, c) => {
        const y = piece.y + r;
        if (filled && y >= 0) this.board[y]![piece.x + c] = piece.type;
      }),
    );

    // Si quedó algo por encima del tablero, el jugador pierde.
    const lockedAboveTop = piece.matrix.some((row, r) => row.some((filled) => filled && piece.y + r < 0));
    this.clearLines();
    if (lockedAboveTop) {
      this.endGame();
      return;
    }
    this.spawn();
  }

  private clearLines(): void {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y]!.every((cell) => cell !== null)) {
        this.board.splice(y, 1);
        this.board.unshift(Array<Cell>(COLS).fill(null));
        cleared++;
        y++; // revisar de nuevo la misma fila
      }
    }
    if (cleared === 0) return;

    const lines = this.stats.lines + cleared;
    this.stats = {
      score: this.stats.score + LINE_POINTS[cleared]! * (this.stats.level + 1),
      lines,
      level: Math.max(this.stats.level, Math.floor(lines / LINES_PER_LEVEL)),
    };
  }

  private spawn(): void {
    this.fillQueue();
    const type = this.queue.shift()!;
    const matrix = SHAPES[type].map((row) => [...row]);
    const piece: ActivePiece = {
      type,
      matrix,
      x: Math.floor((COLS - matrix.length) / 2),
      y: type === 'I' ? -1 : 0,
    };
    this.current = piece;
    this.gravityElapsed = 0;
    this.lockElapsed = 0;

    if (!this.fits(piece.matrix, piece.x, piece.y)) this.endGame();
  }

  private endGame(): void {
    this.isOver = true;
    this.current = null;
  }

  /** Bolsa de 7: cada grupo de 7 piezas contiene una de cada tipo, en orden aleatorio. */
  private fillQueue(): void {
    while (this.queue.length < PREVIEW_SIZE + 1) {
      const bag = [...PIECE_TYPES];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j]!, bag[i]!];
      }
      this.queue.push(...bag);
    }
  }
}
