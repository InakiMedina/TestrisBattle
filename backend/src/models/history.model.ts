import { model, Schema, Types } from 'mongoose';
import type { IGameRecord, IHistory } from '@shared/types/history.types';

const MAX_HISTORY_GAMES = 20;

type IHistoryDocument = Omit<IHistory, 'playerId'> & {
  playerId: Types.ObjectId;
};

const historySchema = new Schema<IHistoryDocument>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    games: {
      type: [
        {
          playerAId: { type: String, required: true },
          playerBId: { type: String, required: true },
          winnerId: { type: String, required: true },
          duration: { type: Number, required: true, min: 0 },
          data: { type: Date, required: true, default: Date.now },
          playerAData: {
            elo: { type: Number, required: true, min: 0 },
            eloGained: { type: Number, required: true },
            league: { type: String, required: true },
            score: { type: Number, required: true, min: 0 },
            lines_destroyed: { type: Number, required: true, min: 0 },
            powers_used: { type: Number, required: true, min: 0 },
          },
          playerBData: {
            elo: { type: Number, required: true, min: 0 },
            eloGained: { type: Number, required: true },
            league: { type: String, required: true },
            score: { type: Number, required: true, min: 0 },
            lines_destroyed: { type: Number, required: true, min: 0 },
            powers_used: { type: Number, required: true, min: 0 },
          },
        },
      ],
      validate: {
        validator: (games: IGameRecord[]) => games.length <= MAX_HISTORY_GAMES,
        message: `History can contain at most ${MAX_HISTORY_GAMES} games`,
      },
      default: [],
    },
  },
  { timestamps: true },
);

export const History = model<IHistoryDocument>('History', historySchema);

export function addGameToHistory(playerId: string, game: IGameRecord) {
  return History.updateOne(
    { playerId },
    { $push: { games: { $each: [game], $slice: -MAX_HISTORY_GAMES } } },
    { upsert: true, runValidators: true },
  );
}
