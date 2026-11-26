export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type PieceMatrix = number[][];

export const PIECE_SHAPES: Record<PieceType, PieceMatrix> = {
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

export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

function cropShape(matrix: PieceMatrix): PieceMatrix {
  const rows = matrix.filter((row) => row.some(Boolean));
  const firstColumn = Math.min(...rows.map((row) => row.findIndex(Boolean)));
  const lastColumn = Math.max(...rows.map((row) => row.lastIndexOf(1)));
  return rows.map((row) => row.slice(firstColumn, lastColumn + 1));
}

export const PIECE_PREVIEW_SHAPES: Record<PieceType, PieceMatrix> = {
  I: cropShape(PIECE_SHAPES.I),
  O: cropShape(PIECE_SHAPES.O),
  T: cropShape(PIECE_SHAPES.T),
  S: cropShape(PIECE_SHAPES.S),
  Z: cropShape(PIECE_SHAPES.Z),
  J: cropShape(PIECE_SHAPES.J),
  L: cropShape(PIECE_SHAPES.L),
};
