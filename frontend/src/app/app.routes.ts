import { Routes } from '@angular/router';
import { Login } from './features/player/pages/login/login';
import { Signin } from './features/player/pages/signin/signin';
import { Practice } from './features/player/pages/practice/practice'
import { PerfilPage } from './features/player/pages/profile/perfil-page';
import { History } from './features/player/pages/history/history';
import { MainLayout } from './shared/layouts/main-layout/main-layout';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'login',
		pathMatch: 'full'
	},
	{
		path: '',
		component: MainLayout,
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
		]
	},
	{
		path: 'login',
		component: Login
  	},
	{
		path: 'signin',
		component: Signin
  	},
	{
		path: '**',
		redirectTo: 'not-found'
	}
];
