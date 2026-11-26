import type { Role } from './auth.types';

export interface IUserStats {
	games_played: number;
	highest_score_rank: number;
	highest_score_solo: number;
	lines_destroyed: number;
	powers_used: number;
}

// Fondo personalizado subido por el usuario. El archivo vive en S3 (key);
// en MongoDB solo se guarda la referencia.
export interface IUserBackground {
	id?: string;
	key: string;
	createdAt: Date;
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
	customBackgrounds: IUserBackground[];
	league: string;
	stats: IUserStats;
}
