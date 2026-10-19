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
		component: Login
  	},
	{
		path: 'signin',
		component: Signin
  	},
	{
		path: 'home',
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
		path: '**',
		redirectTo: 'not-found'
	}
];
