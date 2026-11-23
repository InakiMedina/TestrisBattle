import { Scene, GameObjects, Game } from 'phaser';
import { SQUARE_SIZE } from '../constants';

const piecesData = [ {
		name: 'l-shape',
		angle: 90
	}, 
	{
		name: 'j-shape',
		angle: 270
	}]


const gravity = 100;

export class RandomPiece extends GameObjects.Container {
	piece: GameObjects.Image
	pieceNumber: number

	constructor (scene: Scene, 
				pieceNumber: number,
				x: number, 
				y: number) {

		super(scene, SQUARE_SIZE*x, SQUARE_SIZE*y);
		this.pieceNumber = pieceNumber;
		this.piece = scene.add.image(SQUARE_SIZE*x, SQUARE_SIZE*y, 'pieces', piecesData[pieceNumber].name).setScale(0.5);
		this.rotate(piecesData[pieceNumber].angle)
	}

	rotate (angle: number) {
		let obsAngle = this.piece.angle + angle;
		obsAngle = obsAngle % 360;
		if (obsAngle < 0)
			obsAngle += 360;
		
		switch (obsAngle) {
			case 0:
				this.piece.setOrigin(0.5).setAngle(0).setOrigin(0);
				break;

			case 90:
				this.piece.setOrigin(0.5).setAngle(90).setOrigin(0, 1);
				break;

			case 180:
				this.piece.setOrigin(0.5).setAngle(180).setOrigin(1);
				break;

			case 270:
				this.piece.setOrigin(0.5).setAngle(270).setOrigin(1, 0);
				break;
		}
	}

	onTheGround () {
		if (this.piece.y / SQUARE_SIZE >= 20)
			return true
		return false
	}

	override update ( delta: number)
    {
		const dt = delta / 1000;
		this.piece.y += gravity * dt;

    }

}