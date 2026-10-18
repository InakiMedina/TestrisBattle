import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar'
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-main-layout',
  imports: [Navbar, RouterOutlet],
  template: ` 
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
  `,
  styles: ``,
})
export class MainLayout {}
