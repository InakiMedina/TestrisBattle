import { Component, OnInit, inject } from '@angular/core';
import { Navbar } from '../../../core/layout/navbar/navbar'
import { RouterOutlet } from '@angular/router';
import { BackgroundHandler } from '../../../services/background-handler';


@Component({
  selector: 'app-main-layout',
  imports: [Navbar, RouterOutlet],
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
