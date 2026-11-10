
import { Component } from '@angular/core';
import { Match } from '../../../../../../shared/interfaces/match-interface';
import { UpperCasePipe } from '@angular/common';


@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {

  partidas: Match[] = [
    {
      nombreEnemigo: 'T-Spin_Wizard',
      resultado: 'Victoria',
      score: 58400,
      fecha: '2026-10-18',
      duracion: '06:21'
    },
    {
      nombreEnemigo: 'MatrixGlitcher',
      resultado: 'Derrota',
      score: 19200,
      fecha: '2026-10-17',
      duracion: '02:44'
    },
    {
      nombreEnemigo: 'BlockDropper99',
      resultado: 'Victoria',
      score: 74300,
      fecha: '2026-10-17',
      duracion: '08:12'
    },
    {
      nombreEnemigo: 'line_clear_god',
      resultado: 'Derrota',
      score: 24100,
      fecha: '2026-10-16',
      duracion: '03:10'
    },
    {
      nombreEnemigo: 'TacoDeAsada',
      resultado: 'Victoria',
      score: 51200,
      fecha: '2026-10-16',
      duracion: '05:50'
    },
    {
      nombreEnemigo: 'T-Spin_Wizard',
      resultado: 'Victoria',
      score: 58400,
      fecha: '2026-10-18',
      duracion: '06:21'
    },
    {
      nombreEnemigo: 'MatrixGlitcher',
      resultado: 'Derrota',
      score: 19200,
      fecha: '2026-10-17',
      duracion: '02:44'
    },
    {
      nombreEnemigo: 'BlockDropper99',
      resultado: 'Victoria',
      score: 74300,
      fecha: '2026-10-17',
      duracion: '08:12'
    },
    {
      nombreEnemigo: 'line_clear_god',
      resultado: 'Derrota',
      score: 24100,
      fecha: '2026-10-16',
      duracion: '03:10'
    },
    {
      nombreEnemigo: 'TacoDeAsada',
      resultado: 'Victoria',
      score: 51200,
      fecha: '2026-10-16',
      duracion: '05:50'
    }
  ];

}
