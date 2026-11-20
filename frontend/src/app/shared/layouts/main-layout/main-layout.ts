import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackgroundHandler } from '../../../services/background-handler';


@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit{
  private backgroundHandler = inject(BackgroundHandler);
  
  ngOnInit():void{
    // Recupera el fondo elegido en Perfil; usa el fondo predeterminado solo si no hay uno guardado.
    const selectedBackground = localStorage.getItem('fondoSeleccionado');
    const background = selectedBackground || '/backgrounds/city_image.jpg';
    this.backgroundHandler.changeBackground(background);
  }

}
