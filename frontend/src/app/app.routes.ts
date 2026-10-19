import { Routes } from '@angular/router';
import { Practice } from './features/player/pages/practice/practice'
import { Leaderboard } from './features/player/pages/leaderboard/leaderboard';
import { PerfilPage } from './features/player/pages/profile/perfil-page';
import { MainLayout } from './shared/layouts/main-layout/main-layout';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'practice',
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
				path: 'leaderboard',
				component: Leaderboard
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
