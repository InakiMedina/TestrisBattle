import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SQUARE_SIZE } from '../constants';

export class Game extends Scene
{
    pieces: Phaser.GameObjects.Image[] = [];
    gameText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {

        this.pieces[0] = this.add.image(SQUARE_SIZE*2, SQUARE_SIZE*5, 'pieces', 'l-shape').setScale(0.5).setAngle(90).setOrigin(0, 1);
        this.pieces[1] = this.add.image(SQUARE_SIZE*4, SQUARE_SIZE*5, 'pieces', 'l-shape').setScale(0.5).setAngle(180).setOrigin(1);
        this.pieces[2] = this.add.image(SQUARE_SIZE*2, SQUARE_SIZE*7, 'pieces', 'j-shape').setScale(0.5).setAngle(270).setOrigin(1, 0);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}