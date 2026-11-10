import type { IAuthUser } from '@shared/types/auth.types';
import type { IUser } from '@shared/types/user.types';

// Convierte un documento de Mongoose en el usuario público (IAuthUser):
// _id pasa a id (texto) y nunca se incluye hashPass.
export function toPublicUser(doc: IUser & { _id: unknown }): IAuthUser {
  return {
    id: String(doc._id),
    username: doc.username,
    email: doc.email,
    role: doc.role,
    profilePicture: doc.profilePicture,
    background: doc.background,
    elo: doc.elo,
    league: doc.league,
    stats: {
      games_played: doc.stats.games_played,
      highest_score_rank: doc.stats.highest_score_rank,
      highest_score_solo: doc.stats.highest_score_solo,
      lines_destroyed: doc.stats.lines_destroyed,
      powers_used: doc.stats.powers_used,
    },
  };
}
