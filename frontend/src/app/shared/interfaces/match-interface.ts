
export type MatchResult = 'Victoria' | 'Derrota';

export interface Match {
  id?: string;
  nombreEnemigo: string;
  resultado: MatchResult;
  score: number;
  fecha: string;
  duracion: string;
}
