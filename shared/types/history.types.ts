export interface IPlayerGameData {
	elo: number;
	eloGained: number;
	league: string;
	score: number;
	lines_destroyed: number;
	powers_used: number;
}

export interface IGameRecord {
	id?: string;
	playerAId: string;
	playerBId: string;
	winnerId: string;
	duration: number;
	data: Date;
	playerAData: IPlayerGameData;
	playerBData: IPlayerGameData;
}

export interface IHistory {
	playerId: string;
	games: IGameRecord[];
}