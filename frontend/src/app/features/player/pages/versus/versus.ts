import { Component, inject } from '@angular/core';
import { OFFLINE_MESSAGE } from '../../../../core/realtime/realtime.service';
import { PhaserGame } from '../../../../phaser-game.component';
import { ALL_POWERS } from '../../data/player-powers';
import { GameData } from '../../components/game-data/game-data';
import { NextPieces } from '../../components/next-pieces/next-pieces';
import { VersusStore } from './versus.store';

const REASON_LABELS = {
  'topped-out': 'tablero lleno',
  forfeit: 'abandono',
  disconnected: 'desconexión',
} as const;

@Component({
  selector: 'app-versus',
  standalone: true,
  imports: [PhaserGame, GameData, NextPieces],
  // El store vive y muere con la vista: sus listeners se limpian al salir.
  providers: [VersusStore],
  templateUrl: './versus.html',
  styleUrl: './versus.scss',
})
export class Versus {
  protected readonly store = inject(VersusStore);
  protected readonly offlineMessage = OFFLINE_MESSAGE;
  protected readonly reasonLabels = REASON_LABELS;
  protected readonly powers = ALL_POWERS;
}
