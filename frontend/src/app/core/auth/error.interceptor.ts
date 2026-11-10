import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SKIP_UNAUTHORIZED_HANDLING } from '../http/http-context';
import { NotificationService } from '../notifications/notification.service';
import { AuthService } from './auth.service';

// Único lugar donde se manejan los errores HTTP globales:
//  - 401: sesión caducada o inválida
//  - 403: sin permiso
//  - 0 y 5xx: banner de error de conexión o de servidor
// Los errores "4xx" de formularios los muestra cada formulario.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          if (!req.context.get(SKIP_UNAUTHORIZED_HANDLING)) {
            auth.handleSessionExpired();
          }
        } else if (error.status === 403) {
          notifications.error('No tienes permiso para realizar esta acción.');
        } else if (error.status === 0) {
          notifications.error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
        } else if (error.status >= 500) {
          notifications.error('Ocurrió un error en el servidor. Inténtalo más tarde.');
        }
      }
      return throwError(() => error);
    }),
  );
};
