import { EventBus } from '../EventBus';
import { GameObjects, Scene } from 'phaser';
import type { PlayerStats } from '@shared/types/realtime.types';
import { GAME_EVENTS, HEADER_ROWS, REGISTRY, SQUARE_SIZE, type GameMode } from '../constants';
import { CELL_FRAMES, RandomPiece, createCell } from '../components/RandomPiece';
import { COLS, ROWS, TetrisEngine } from '../logic/TetrisEngine';

const BOARD_TOP = HEADER_ROWS * SQUARE_SIZE;

/**
 * Partida de Tetris.
 * Las reglas viven en TetrisEngine; esta escena dibuja el tablero con los
 * cuadros del atlas 'pieces', lee el teclado y avanza el juego en update().
 *
 * En modo 'versus' Angular controla cuándo corre (registry 'running') y recibe
 * el puntaje, las siguientes piezas y el fin del juego por `game.events`.
 */
export class Game extends Scene
{
    engine: TetrisEngine;
    currentPiece: RandomPiece;
    ghostPiece: RandomPiece;
    boardCells: GameObjects.Image[][] = [];
    score: GameObjects.Text;
    details: GameObjects.Text;

    private mode: GameMode = 'practice';
    private running = true;
    private lastScore = -1;
    private lastNext = '';
    private overHandled = false;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.mode = this.registry.get(REGISTRY.mode) ?? 'practice';
        this.running = this.mode === 'practice' || this.registry.get(REGISTRY.running) === true;
        this.lastScore = -1;
        this.lastNext = '';
        this.overHandled = false;

        const initialStats: PlayerStats | null = this.registry.get(REGISTRY.initialStats) ?? null;
        this.engine = new TetrisEngine(initialStats ?? {});

        const surfaceBackground = getComputedStyle(document.documentElement)
            .getPropertyValue('--app-surface-background')
            .trim();
        this.cameras.main.setBackgroundColor(surfaceBackground || '#35334f');

        this.drawBoardBackground();

        // Un cuadro por celda del tablero; se muestran u ocultan según el estado.
        this.boardCells = Array.from({ length: ROWS }, (_, y) =>
            Array.from({ length: COLS }, (_, x) =>
                createCell(this, CELL_FRAMES.I)
                    .setPosition(x * SQUARE_SIZE, BOARD_TOP + y * SQUARE_SIZE)
                    .setVisible(false)
            )
        );
        this.ghostPiece = new RandomPiece(this, 0.25);
        this.currentPiece = new RandomPiece(this);

        this.score = this.add.text(SQUARE_SIZE * COLS / 2, 40, '', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.details = this.add.text(SQUARE_SIZE * COLS / 2, 80, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#e8ad00',
            align: 'center'
        }).setOrigin(0.5);

        this.setupKeyboard();

        // Angular cambia 'running' cuando inicia o termina la partida.
        const onRunningChange = (_parent: unknown, value: boolean) => { this.running = value; };
        this.registry.events.on(`changedata-${REGISTRY.running}`, onRunningChange);
        this.events.once('shutdown', () => {
            this.registry.events.off(`changedata-${REGISTRY.running}`, onRunningChange);
            this.input.keyboard?.off('keydown');
        });

        this.emitChanges();
        this.render();

        EventBus.emit('current-scene-ready', this);
    }

    override update (_time: number, delta: number)
    {
        if (!this.running || this.engine.isOver) return;
        // Limita el salto si la pestaña estuvo en segundo plano.
        this.engine.tick(Math.min(delta, 100));
        this.emitChanges();
        this.render();
    }

    private setupKeyboard ()
    {
        const keyboard = this.input.keyboard;
        if (!keyboard) return;

        // Evita que las flechas y el espacio desplacen la página.
        keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');

        keyboard.on('keydown', (event: KeyboardEvent) => {
            if (!this.running || this.engine.isOver) return;
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

            switch (event.code) {
                case 'ArrowLeft': this.engine.moveLeft(); break;
                case 'ArrowRight': this.engine.moveRight(); break;
                case 'ArrowDown': this.engine.softDrop(); break;
                case 'ArrowUp':
                case 'KeyX': this.engine.rotate(1); break;
                case 'KeyZ': this.engine.rotate(-1); break;
                case 'Space': this.engine.hardDrop(); break;
                default: return;
            }
            this.emitChanges();
            this.render();
        });
    }

    private drawBoardBackground ()
    {
        const width = COLS * SQUARE_SIZE;
        const height = ROWS * SQUARE_SIZE;

        this.add.rectangle(0, BOARD_TOP, width, height, 0x0a0919, 0.85).setOrigin(0);

        const grid = this.add.graphics();
        grid.lineStyle(1, 0xffffff, 0.06);
        for (let x = 0; x <= COLS; x++) {
            grid.lineBetween(x * SQUARE_SIZE, BOARD_TOP, x * SQUARE_SIZE, BOARD_TOP + height);
        }
        for (let y = 0; y <= ROWS; y++) {
            grid.lineBetween(0, BOARD_TOP + y * SQUARE_SIZE, width, BOARD_TOP + y * SQUARE_SIZE);
        }
    }

    private render ()
    {
        const { board, current, isOver, stats } = this.engine;

        board.forEach((row, y) =>
            row.forEach((cell, x) => {
                const image = this.boardCells[y][x];
                if (!cell) {
                    image.setVisible(false);
                    return;
                }
                image.setVisible(true)
                    .setFrame(CELL_FRAMES[cell])
                    .setDisplaySize(SQUARE_SIZE, SQUARE_SIZE)
                    .setTint(isOver ? 0x777777 : 0xffffff);
            })
        );

        if (current) {
            this.ghostPiece.show(current, this.engine.ghostY);
            this.currentPiece.show(current);
        } else {
            this.ghostPiece.hide();
            this.currentPiece.hide();
        }

        this.score.setText(`Score: ${stats.score}`);
        this.details.setText(`Level ${stats.level}   ·   Lines ${stats.lines}`);
    }

    /** Avisa a Angular de los cambios y maneja el fin del juego. */
    private emitChanges ()
    {
        const { stats, isOver } = this.engine;

        if (stats.score !== this.lastScore) {
            this.lastScore = stats.score;
            this.game.events.emit(GAME_EVENTS.stats, { ...stats });
        }

        const next = this.engine.nextPieces;
        const key = next.join('');
        if (key !== this.lastNext) {
            this.lastNext = key;
            this.game.events.emit(GAME_EVENTS.next, next);
        }

        if (isOver && !this.overHandled) {
            this.overHandled = true;
            this.game.events.emit(GAME_EVENTS.over, { ...stats });
            this.render();

            // En práctica se muestra la escena GameOver; en 1 vs 1 el resultado lo muestra Angular.
            if (this.mode === 'practice') {
                this.time.delayedCall(800, () => this.changeScene());
            }
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver', { score: this.engine.stats.score });
    }
}
