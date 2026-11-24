import { createServer } from 'node:http';
import app from './app';
import config from './config/config';
import mongoose from 'mongoose';
import { setupSwagger } from './swagger';
import { seedUsers } from './services/seed';
import { setupRealtime } from './realtime/socket';

async function start(): Promise<void> {
  try {
    await mongoose.connect(config.mongoDBURL, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
    await seedUsers();
  } catch (error) {
    console.error('Could not start the server:', error);
    process.exit(1);
  }

  setupSwagger(app, config.port);

  // Express y Socket.IO comparten el mismo servidor HTTP (y el mismo puerto).
  const httpServer = createServer(app);
  setupRealtime(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Socket.IO listening on ws://localhost:${config.port}`);
  });
}

void start();
