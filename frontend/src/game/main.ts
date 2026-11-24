import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { REGISTRY, SQUARE_SIZE, type GameMode } from './constants';
import type { PlayerStats } from '@shared/types/realtime.types';


// Documentación de phaser y su configuración:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: SQUARE_SIZE * 10,
    height: SQUARE_SIZE * 24,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

export interface StartGameOptions {
    mode?: GameMode;
    /** Solo en 'versus': si el juego avanza (Angular lo cambia al iniciar/terminar). */
    running?: boolean;
    /** Puntaje con el que arranca (para retomar una partida tras recargar la página). */
    initialStats?: PlayerStats | null;
}

const StartGame = (parent: string | HTMLElement, options: StartGameOptions = {}) => {

    const game = new Game({ ...config, parent });

    // El registry existe desde la construcción; las escenas lo leen al crearse.
    game.registry.set(REGISTRY.mode, options.mode ?? 'practice');
    game.registry.set(REGISTRY.running, options.running ?? true);
    game.registry.set(REGISTRY.initialStats, options.initialStats ?? null);

    return game;

}

export default StartGame;