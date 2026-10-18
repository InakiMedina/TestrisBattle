import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar'
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-main-layout',
  imports: [Navbar, RouterOutlet],
  template: ` 
    <div class="container">
      <app-navbar></app-navbar>
      <div class="page-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrl: './main-layout.scss'
})
export class MainLayout {}
