import { model, Schema } from 'mongoose';
import type { IUser } from '@shared/types/user.types';

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    hashPass: { type: String, required: true, select: false },
    profilePicture: { type: String, required: true, default: '' },
    elo: { type: Number, required: true, default: 1000, min: 0 },
    background: { type: String, required: true, default: '' },
    league: { type: String, required: true, default: 'Unranked' },
    stats: {
      games_played: { type: Number, default: 0, min: 0 },
      highest_score_rank: { type: Number, default: 0, min: 0 },
      highest_score_solo: { type: Number, default: 0, min: 0 },
      lines_destroyed: { type: Number, default: 0, min: 0 },
      powers_used: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);