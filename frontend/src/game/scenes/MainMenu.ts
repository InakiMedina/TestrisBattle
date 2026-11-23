import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { CustomeButton } from '../components/CustomButton';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    // title: GameObjects.Text;
    playButton: GameObjects.Container;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const surfaceBackground = getComputedStyle(document.documentElement)
            .getPropertyValue('--app-surface-background')
            .trim();
        this.cameras.main.setBackgroundColor(surfaceBackground);

        // this.background = this.add.image(500, 646, 'background');

        this.logo = this.add.image(175, 125, 'logo').setDepth(100).setDisplaySize(200, 150);

        this.playButton = new CustomeButton(this, 175, 300, 200, 100, "Play", () => {
            this.scene.start("Game")
        })

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