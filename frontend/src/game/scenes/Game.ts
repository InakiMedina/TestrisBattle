import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SQUARE_SIZE } from '../constants';
import { RandomPiece } from '../components/RandomPiece';

export class Game extends Scene
{
    pieces: RandomPiece[] = [];
    noCurrentPiece: boolean = true;
    currentPiece: RandomPiece;
    score: Phaser.GameObjects.Text;
    scoreValue: number = 0

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('Game');
    }

    create ()
    {

        // this.pieces[0] = new RandomPiece(this, 0, 2, 5);
        // this.pieces[1] = new RandomPiece(this, 0, 4, 5);
        // this.pieces[2] = new RandomPiece(this, 1, 2, 7);
        // this.pieces[0].addGravity()
        // this.pieces[1].rotate(-90)

        
        this.score = this.add.text(250, 100, "Score: " + this.scoreValue, {
			fontFamily: 'Arial',
			fontSize: '18px',
			color: '#ffffff',
			align: 'center'
		}).setOrigin(0.5)

        EventBus.emit('current-scene-ready', this);

        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    override update (time: number, delta: number)
    {
        this.score.setText(`Score: ${this.scoreValue}`)

        if (this.noCurrentPiece && this.cursors.space.isDown) {
            this.noCurrentPiece = false;
            this.pieces[this.pieces.length] = new RandomPiece(this, Math.floor(Math.random()*2) , 5, 0);
            this.currentPiece = this.pieces[this.pieces.length - 1];
        } else if (!this.noCurrentPiece && this.currentPiece.onTheGround()) {
            this.noCurrentPiece = true;
        }

        if (!this.noCurrentPiece) {
            this.currentPiece.update(delta)

            if (this.currentPiece.onTheGround()) {
                this.noCurrentPiece = true;
                this.scoreValue += 100
            }
        }

        
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}