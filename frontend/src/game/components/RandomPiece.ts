import { Scene, GameObjects } from 'phaser';
import { HEADER_ROWS, SQUARE_SIZE } from '../constants';
import type { ActivePiece, PieceType } from '../logic/TetrisEngine';

/** Frame de un solo cuadro (68 px) de cada pieza en el atlas 'pieces'. */
export const CELL_FRAMES: Record<PieceType, string> = {
	I: 'cell-i',
	J: 'cell-j',
	L: 'cell-l',
	O: 'cell-o',
	S: 'cell-s',
	T: 'cell-t',
	Z: 'cell-z',
};

/** Crea un cuadro del tablero con el arte del atlas. */
export function createCell(scene: Scene, frame: string): GameObjects.Image {
	return scene.add.image(0, 0, 'pieces', frame)
		.setOrigin(0)
		.setDisplaySize(SQUARE_SIZE, SQUARE_SIZE);
}

/**
 * Pieza que está cayendo, dibujada cuadro por cuadro (4 imágenes del atlas).
 * La posición y la forma las decide TetrisEngine; aquí solo se dibujan.
 * También se usa, semitransparente, para la "sombra" que indica dónde caerá.
 */
export class RandomPiece extends GameObjects.Container {
	private readonly cells: GameObjects.Image[];

	constructor (scene: Scene, alpha = 1) {
		super(scene, 0, HEADER_ROWS * SQUARE_SIZE);
		this.cells = Array.from({ length: 4 }, () => createCell(scene, CELL_FRAMES.I));
		this.add(this.cells);
		this.setAlpha(alpha);
		scene.add.existing(this);
	}

	/** Dibuja la pieza en la posición indicada (en celdas del tablero). */
	show (piece: ActivePiece, row: number = piece.y) {
		let index = 0;
		piece.matrix.forEach((matrixRow, r) =>
			matrixRow.forEach((filled, c) => {
				if (!filled) return;
				const cell = this.cells[index++];
				// Las celdas por encima del tablero (spawn) no se dibujan.
				cell.setVisible(row + r >= 0)
					.setFrame(CELL_FRAMES[piece.type])
					.setDisplaySize(SQUARE_SIZE, SQUARE_SIZE)
					.setPosition((piece.x + c) * SQUARE_SIZE, (row + r) * SQUARE_SIZE);
			}),
		);
		this.setVisible(true);
	}

	hide () {
		this.setVisible(false);
	}
}
