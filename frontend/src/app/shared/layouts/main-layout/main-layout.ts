import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackgroundHandler } from '../../../services/background-handler';
import { UserFilesService } from '../../../services/user-files.service';


@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit, OnDestroy {
  private backgroundHandler = inject(BackgroundHandler);
  private userFiles = inject(UserFilesService);

  ngOnInit(): void {
    // Inicia las vistas con el fondo que el usuario dejó seleccionado.
    void this.backgroundHandler.restoreSavedBackground();
  }

  // Este layout se destruye al cerrar sesión: se quita el fondo y se liberan las imágenes.
  ngOnDestroy(): void {
    this.backgroundHandler.reset();
    this.userFiles.clearCache();
  }

}
