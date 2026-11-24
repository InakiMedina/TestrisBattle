import {
    Component,
    DestroyRef,
    ElementRef,
    afterNextRender,
    effect,
    inject,
    input,
    output,
    viewChild,
} from "@angular/core";
import Phaser from "phaser";
import type { PlayerStats } from "@shared/types/realtime.types";
import StartGame from "../game/main";
import { EventBus } from "../game/EventBus";
import { GAME_EVENTS, REGISTRY, type GameMode } from "../game/constants";
import type { PieceType } from "../game/logic/TetrisEngine";

let nextInstanceId = 0;

@Component({
    selector: 'phaser-game',
    // Id único por instancia: puede haber más de un juego en la misma página.
    template: '<div #container class="game-container" [id]="containerId"></div>',
    styles: [`
        :host, .game-container {
            display: block;
            width: 100%;
            height: 100%;
        }
    `],
    standalone: true,
})
export class PhaserGame
{
    /** 'practice' muestra el menú con Play; 'versus' arranca directo y lo controla Angular. */
    readonly mode = input<GameMode>('practice');
    /** Solo en 'versus': el juego avanza mientras sea true. */
    readonly running = input(true);
    /** Puntaje inicial (para retomar una partida). Se lee al crear el juego. */
    readonly initialStats = input<PlayerStats | null>(null);

    readonly statsChange = output<PlayerStats>();
    readonly nextChange = output<PieceType[]>();
    readonly gameOver = output<PlayerStats>();

    readonly containerId = `game-container-${++nextInstanceId}`;

    scene: Phaser.Scene;
    game: Phaser.Game;
    sceneCallback: (scene: Phaser.Scene) => void;

    private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

    // Se guarda la referencia para poder quitar el listener al destruir el componente
    // (si no, se acumulan listeners en el EventBus global cada vez que se entra a la vista).
    private readonly onSceneReady = (scene: Phaser.Scene) =>
    {
        // El EventBus es global: ignorar escenas de otros juegos.
        if (scene.game !== this.game) return;

        this.scene = scene;

        if (this.sceneCallback)
        {
            this.sceneCallback(scene);
        }
    };

    constructor ()
    {
        afterNextRender(() =>
        {
            EventBus.on('current-scene-ready', this.onSceneReady);

            this.game = StartGame(this.container().nativeElement, {
                mode: this.mode(),
                running: this.running(),
                initialStats: this.initialStats(),
            });

            this.game.events.on(GAME_EVENTS.stats, (stats: PlayerStats) => this.statsChange.emit(stats));
            this.game.events.on(GAME_EVENTS.next, (next: PieceType[]) => this.nextChange.emit(next));
            this.game.events.on(GAME_EVENTS.over, (stats: PlayerStats) => this.gameOver.emit(stats));
        });

        // Pasa a Phaser los cambios de `running` (inicio y fin de la partida en 1 vs 1).
        effect(() =>
        {
            const running = this.running();
            this.game?.registry.set(REGISTRY.running, running);
        });

        inject(DestroyRef).onDestroy(() =>
        {
            EventBus.off('current-scene-ready', this.onSceneReady);

            if (this.game)
            {
                this.game.destroy(true);
            }
        });
    }
}
