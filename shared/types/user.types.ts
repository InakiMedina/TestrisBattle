import type { Role } from './auth.types';

export interface IUserStats {
	games_played: number;
	highest_score_rank: number;
	highest_score_solo: number;
	lines_destroyed: number;
	powers_used: number;
}

export interface IUser {
	id?: string;
	username: string;
	email: string;
	hashPass: string;
	role: Role;
	profilePicture: string;
	elo: number;
	background: string;
	league: string;
	stats: IUserStats;
}
