// 1. The Type Definitions (Contract)
export type LeagueTier = 'Dust L' | 'Ocean J' | 'Crimson S' | 'Emerald Z' | 'Nebula T' | 'Gold O' | 'Diamond I';

export interface LeagueRange {
  tier: LeagueTier;
  name: string;
  minElo: number;
  maxElo: number; // Use Infinity for the top tier
}

// 2. The Actual Data (Values)
export const LEAGUE_RANGES: readonly LeagueRange[] = [
  { tier: 'Dust L',   name: 'Dust',    minElo: 0,    maxElo: 699 },
  { tier: 'Ocean J',  name: 'Ocean',   minElo: 700,  maxElo: 1299 },
  { tier: 'Crimson S',name: 'Crimson', minElo: 1300, maxElo: 1799 },
  { tier: 'Emerald Z',name: 'Emerald', minElo: 1800, maxElo: 2099 },
  { tier: 'Nebula T', name: 'Nebula',  minElo: 2100, maxElo: 2299 },
  { tier: 'Gold O',   name: 'Gold',    minElo: 2300, maxElo: 2449 },
  { tier: 'Diamond I',name: 'Diamond', minElo: 2450, maxElo: Infinity },
] as const;

// 3. Shared Pure Helper Function
export function getLeagueByElo(elo: number): LeagueRange {
  const found = LEAGUE_RANGES.find(r => elo >= r.minElo && elo <= r.maxElo);
  return found ?? LEAGUE_RANGES[0];
}