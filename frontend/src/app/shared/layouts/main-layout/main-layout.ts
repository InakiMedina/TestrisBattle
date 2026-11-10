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
    const defaultBackground = '/backgrounds/city_image.jpg';
    this.backgroundHandler.changeBackground(defaultBackground);
  }

}
