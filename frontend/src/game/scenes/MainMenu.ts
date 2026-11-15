import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    // title: GameObjects.Text;
    playButton: GameObjects.Shape;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(500, 646, 'background');

        this.logo = this.add.image(150, 125, 'logo').setDepth(100).setDisplaySize(200, 150);

        // this.title = this.add.text(100, 100, 'Main Menu', {
        //     fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 5,
        //     align: 'center'
        // }).setOrigin(0.5).setDepth(100);

        const r = 80;
        const a = Math.sqrt(3)*r/2
        this.playButton = this.add.triangle(150, 400, -r/2, a, -r/2, -a, r, 0, 0xffffff).setOrigin(0);

        EventBus.emit('current-scene-ready', this);
    }
    
    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    moveLogo (vueCallback: ({ x, y }: { x: number, y: number }) => void)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        } 
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback)
                    {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}