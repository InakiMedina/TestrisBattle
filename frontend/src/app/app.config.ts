import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/auth/error.interceptor';
import { cleanupLegacyLocalImages } from './core/storage/legacy-storage-cleanup';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // Restaura la sesión (token guardado + GET /auth/me) antes del primer render
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restoreSession())),
    // Borra las imágenes que antes se guardaban en el navegador (ahora viven en S3)
    provideAppInitializer(() => cleanupLegacyLocalImages()),
  ],
};
