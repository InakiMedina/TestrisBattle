import { Scene } from 'phaser';
import { REGISTRY } from '../constants';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(128, 136, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(128, 136, 119, 8).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(128-57, 161, 1, 6, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        
        this.load.atlas('pieces', 'pieces/pieces.png', 'pieces/pieces.json');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        //  En 1 vs 1 no hay menú: la partida la inicia Angular cuando ambos jugadores están listos.
        if (this.registry.get(REGISTRY.mode) === 'versus') {
            this.scene.start('Game');
            return;
        }
        this.scene.start('MainMenu');
    }
}