export interface IPlayerGameData {
	elo: number,
	eloGained: number,
	league: string,
	score: number,
	lines_destroyed: number,
	powers_used: number
}

export interface IGameRecord {
	winner: false,
	duration: number,
	data: Date,
	playerAData: IPlayerGameData,
	playerBData: IPlayerGameData
}

export interface IHistory {
	playerId: string
	games: IHistory[]
}