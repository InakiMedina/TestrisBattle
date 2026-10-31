import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongoDBURL: string;
  mySecret: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoDBURL: process.env.MONGODB_URL || '',
  mySecret: process.env.MY_SECRET || ''
};

export default config;