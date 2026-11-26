import type { Power } from '../../../shared/interfaces/power-interface';

export const LEFT_POWERS: Power[] = [
  {
    id: 'push',
    name: 'Push',
    image: '/power/push.png',
    description: 'Permite alterar la posición de las piezas del oponente.',
  },
  {
    id: 'shuffle',
    name: 'Shuffle',
    image: '/power/shuffle.png',
    description: 'Modifica aleatoriamente la pila de piezas que recibirá el oponente.',
  },
  {
    id: 'block',
    name: 'Block',
    image: '/power/block.png',
    description: 'Genera un obstáculo que dificulta el juego del oponente.',
  },
];

export const RIGHT_POWERS: Power[] = [
  {
    id: 'gravity-minus',
    name: 'Gravity -',
    image: '/power/gravity-.png',
    description: 'Disminuye temporalmente la velocidad con la que caen las piezas del oponente.',
  },
  {
    id: 'gravity-plus',
    name: 'Gravity +',
    image: '/power/gravity+.png',
    description: 'Aumenta temporalmente la velocidad con la que caen las piezas del oponente.',
  },
  {
    id: 'chaos',
    name: 'Chaos',
    image: '/power/chaos.png',
    description: 'Provoca una alteración especial en el tablero del oponente.',
  },
];

export const ALL_POWERS: Power[] = [...LEFT_POWERS, ...RIGHT_POWERS];
