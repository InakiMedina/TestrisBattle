
import { Component, signal } from '@angular/core';
import type { PlayerStats } from '@shared/types/realtime.types';
import { PhaserGame } from '../../../../../app/phaser-game.component';
import type { PieceType } from '../../../../../game/logic/piece-data';
import { ALL_POWERS, LEFT_POWERS, RIGHT_POWERS } from '../../data/player-powers';
import { GameData } from '../../components/game-data/game-data';
import { NextPieces } from '../../components/next-pieces/next-pieces';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [PhaserGame, GameData, NextPieces],
  templateUrl: './practice.html',
  styleUrl: './practice.scss',
})
export class Practice {
  readonly stats: PlayerStats = { score: 100, level: 0, lines: 100 };
  readonly record = 0;
  readonly pointsToNextPower = 1000;
  readonly nextPieces = signal<PieceType[]>([]);
  readonly poderesIzquierda = LEFT_POWERS;
  readonly poderesDerecha = RIGHT_POWERS;
  readonly todosLosPoderes = ALL_POWERS;
}
