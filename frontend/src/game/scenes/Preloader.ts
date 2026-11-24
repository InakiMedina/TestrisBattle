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
        // Cargamos esta imagen en la escena Boot, por lo que podemos mostrarla aquí.
        this.add.image(128, 136, 'background');

        // Barra de progreso sencilla. Este rectángulo representa el contorno de la barra.
        this.add.rectangle(128, 136, 119, 8).setStrokeStyle(1, 0xffffff);

        // Esta es la barra de progreso. Aumentará su tamaño desde la izquierda
        // según el porcentaje de carga.
        const bar = this.add.rectangle(128-57, 161, 1, 6, 0xffffff);

        // Utilizamos el evento 'progress' de LoaderPlugin para actualizar la barra de carga.
        this.load.on('progress', (progress: number) => {

            // Actualizamos la barra de progreso.
            // La barra tiene un ancho de 464 px, por lo que el 100 % equivale a 464 px.
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        // Cargamos los recursos del juego.
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        
        this.load.atlas('pieces', 'pieces/pieces.png', 'pieces/pieces.json');
    }

    create ()
    {
        // Cuando todos los recursos se hayan cargado, podemos crear aquí objetos globales
        // que el resto del juego pueda utilizar.
        // Por ejemplo, podemos definir animaciones globales para las demás escenas.

        // Pasamos a la escena MainMenu. También podríamos utilizar una transición,
        // como un desvanecimiento de la cámara.

        // En el modo 1 vs 1 no hay menú: Angular inicia la partida cuando ambos jugadores están listos.
        if (this.registry.get(REGISTRY.mode) === 'versus') {
            this.scene.start('Game');
            return;
        }
        this.scene.start('MainMenu');
    }
}