export const SQUARE_SIZE = 34;

/** Filas libres arriba del tablero, donde se muestra el puntaje. */
export const HEADER_ROWS = 4;

/**
 * Modo en el que arranca el juego:
 * - 'practice': menú principal con botón Play y juego libre (/practice).
 * - 'versus': sin menú; Angular decide cuándo corre el juego (/versus).
 */
export type GameMode = 'practice' | 'versus';

/** Claves del registry de Phaser que Angular escribe para configurar el juego. */
export const REGISTRY = {
  mode: 'mode',
  running: 'running',
  initialStats: 'initialStats',
} as const;

/**
 * Eventos que la escena Game emite en `game.events` (uno por instancia de Phaser,
 * así no se mezclan entre juegos ni se acumulan al navegar).
 */
export const GAME_EVENTS = {
  stats: 'tetris:stats',
  next: 'tetris:next',
  over: 'tetris:game-over',
} as const;
