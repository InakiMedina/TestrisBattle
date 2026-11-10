
import { Component, OnInit } from '@angular/core';
import { Power } from '../../../../shared/interfaces/power-interface';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [],
  templateUrl: './practice.html',
  styleUrl: './practice.scss',
})
export class Practice implements OnInit {

  score = 100;
  nivel = 0;
  lineas = 100;
  record = 0;
  puntosSiguientePoder = 1000;

  caraDado = 0;
  poderSeleccionado: Power | null = null;

  poderesIzquierda: Power[] = [
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

  poderesDerecha: Power[] = [
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

  todosLosPoderes: Power[] = [
    ...this.poderesIzquierda,
    ...this.poderesDerecha,
  ];

  ngOnInit(): void {
    // Al iniciar no se selecciona ningún poder.
    this.caraDado = 0;
    this.poderSeleccionado = null;
  }

  lanzarDado(): void {
    this.caraDado = Math.floor(Math.random() * 6) + 1;

    this.poderSeleccionado = this.todosLosPoderes[this.caraDado - 1];
  }

  get imagenDado(): string {
    return this.caraDado === 0
      ? '/dice/1.png'
      : `/dice/${this.caraDado}.png`;
  }
}
