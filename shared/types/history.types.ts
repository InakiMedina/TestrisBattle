export interface PlayerGameData {
	elo: number,
	eloGained: number,
	league: string,
	score: number,
	lines_destroyed: number,
	powers_used: number
}

export interface GameRecord {
	winner: false,
	duration: number,
	data: Date,
	playerAData: PlayerGameData,
	playerBData: PlayerGameData
}

export interface history {
	playerId: string
	games: GameRecord[]
}