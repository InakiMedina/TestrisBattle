import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText : Phaser.GameObjects.Text;
    scoreText: Phaser.GameObjects.Text;
    hintText: Phaser.GameObjects.Text;

    private finalScore = 0;

    constructor ()
    {
        super('GameOver');
    }

    init (data: { score?: number })
    {
        this.finalScore = data?.score ?? 0;
    }

    create ()
    {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(centerX, centerY, 'background');
        this.background.setAlpha(0.5);

        this.gameOverText = this.add.text(centerX, centerY - 40, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 44, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.scoreText = this.add.text(centerX, centerY + 20, `Score: ${this.finalScore}`, {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.hintText = this.add.text(centerX, centerY + 70, 'Click para volver al menú', {
            fontFamily: 'Arial', fontSize: 16, color: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.input.once('pointerdown', () => this.changeScene());

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
