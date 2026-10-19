import { Routes } from '@angular/router';
import { Login } from './features/player/pages/login/login';
import { Signin } from './features/player/pages/signin/signin';
import { Practice } from './features/player/pages/practice/practice'
import { Leaderboard } from './features/player/pages/leaderboard/leaderboard';
import { Profile } from './features/player/pages/profile/profile';
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
				path: 'leaderboard',
				component: Leaderboard
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
