import { Power } from './power-interface';

export interface PoderRanking extends Power {
  posicion: number;
  usos: number;
}

export interface MejorPartida {
  posicion: number;
  rival: string;
  puntaje: number;
  fecha: string;
}

export type VistaRanking = 'poderes' | 'puntos';