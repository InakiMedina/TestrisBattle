import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

interface Config {
  port: number;
  nodeEnv: string;
  mongoDBURL: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  seedAdminPassword: string;
  seedUserPassword: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoDBURL: process.env.MONGODB_URL || '',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  seedAdminPassword: required('SEED_ADMIN_PASSWORD'),
  seedUserPassword: required('SEED_USER_PASSWORD'),
};

export default config;