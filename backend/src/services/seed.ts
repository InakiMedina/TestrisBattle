import bcrypt from 'bcryptjs';
import config from '../config/config';
import { User } from '../models/user.model';
import { SALT_ROUNDS } from './user.services';

// Crea los usuarios iniciales si no existen. Es idempotente:
// no sobrescribe usuarios ya creados ni cambia sus contraseñas.
export async function seedUsers(): Promise<void> {
  const seeds = [
    { username: 'admin', email: 'admin@tetris.test', password: config.seedAdminPassword, role: 'admin' as const, profilePicture: '', background: '' },
    { username: 'jugador', email: 'jugador@tetris.test', password: config.seedUserPassword, role: 'usuario' as const, profilePicture: '', background: '' },
  ];

  for (const seed of seeds) {
    const exists = await User.exists({ $or: [{ email: seed.email }, { username: seed.username }] });
    if (exists) continue;

    await User.create({
      username: seed.username,
      email: seed.email,
      hashPass: await bcrypt.hash(seed.password, SALT_ROUNDS),
      role: seed.role,
      profilePicture: seed.profilePicture,
      background: seed.background,
    });
    console.log(`Seed user created: ${seed.email}`);
  }
}
