import { Routes } from '@angular/router';
import { Login } from './features/player/pages/login/login';
import { Practice } from './features/player/pages/practice/practice'
import { History } from './features/player/pages/history/history';
import { Profile } from './features/player/pages/profile/profile';
import { MainLayout } from './shared/layouts/main-layout/main-layout';

export const routes: Routes = [
	{
		path: '',
		component: Login
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
				component: Profile
			}
		]
	},
	{
		path: '**',
		redirectTo: 'not-found'
	}
];
