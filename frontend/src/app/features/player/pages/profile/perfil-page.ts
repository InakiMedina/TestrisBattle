
import { Component } from '@angular/core';
import { Perfil } from '../profile/components/perfil/perfil';
import { Fondos } from '../profile/components/fondos/fondos';
import { Ranking } from '../profile/components/ranking/ranking';
import { Stats } from '../profile/components/stats/stats';


@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [Perfil, Fondos, Ranking, Stats],
  templateUrl: './perfil-page.html',
  styleUrl: './perfil-page.scss',
})
export class PerfilPage {}
