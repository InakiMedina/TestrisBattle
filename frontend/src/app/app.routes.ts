// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './features/player/pages/login/login';
import { Signin } from './features/player/pages/signin/signin';
import { Practice } from './features/player/pages/practice/practice'
import { PerfilPage } from './features/player/pages/profile/perfil-page';
import { History } from './features/player/pages/history/history';
import { Forbidden } from './features/errors/pages/forbidden/forbidden/forbidden';
import { NotFound } from './features/errors/pages/not-found/not-found/not-found';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
// import { roleGuard } from './core/auth/role.guard'; // se importa al agregar rutas por rol

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'login',
		pathMatch: 'full'
	},
	{
		path: '',
		component: MainLayout,
		canActivate: [authGuard],
		canActivateChild: [authGuard],
		children: [
			{
				path: 'practice',
				component: Practice
			},
			{
				path: 'history',
				component: History
			},
			{
				path: 'profile',
				component: PerfilPage
			}
			// Ruta restringida por rol (la agrega quien implemente la vista de admin):
			// {
			// 	path: '',
			// 	component: AdminUsers,
			// 	canActivate: [roleGuard],
			// 	data: { roles: ['admin'] }
			// }
		]
	},
	{
		path: 'login',
		component: Login,
		canActivate: [guestGuard]
	},
	{
		path: 'signin',
		component: Signin,
		canActivate: [guestGuard]
	},
	{
		path: 'access-denied',
		component: Forbidden
	},
	{
		// Se muestra sin cambiar la URL
		path: '**',
		component: NotFound
	}
];
