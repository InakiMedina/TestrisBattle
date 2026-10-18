import { Routes } from '@angular/router';
import { Practice } from './features/player/pages/practice/practice'
import { Leaderboard } from './features/player/pages/leaderboard/leaderboard';
import { Profile } from './features/player/pages/profile/profile';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'practice',
		pathMatch: 'full'
  	},
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
	},
	{
		path: '**',
		redirectTo: 'not-found'
	}
];
