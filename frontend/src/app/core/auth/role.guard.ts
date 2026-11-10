import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Role } from './auth.models';
import { AuthService } from './auth.service';

// Rutas restringidas por rol. Se configura en la ruta:
//   { path: '...', component: X, canActivate: [roleGuard], data: { roles: ['admin'] } }
// Sin sesión va al login; con sesión pero sin el rol, a la vista de acceso denegado.
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const configured: unknown = route.data['roles'];
  const allowedRoles: Role[] = Array.isArray(configured) ? (configured as Role[]) : [];

  // Si la ruta no declara roles, se niega el acceso
  return auth.hasRole(allowedRoles) ? true : router.createUrlTree(['/access-denied']);
};
