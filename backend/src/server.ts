import app from './app';
import config from './config/config';
import { setupSwagger } from './swagger';
<<<<<<< HEAD
import { connectDB } from './config/db';

connectDB();
=======
import { seedUsers } from './services/seed';

async function start(): Promise<void> {
  try {
    await mongoose.connect(config.mongoDBURL, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
    await seedUsers();
  } catch (error) {
    console.error('Could not start the server:', error);
    process.exit(1);
  }
>>>>>>> main

  setupSwagger(app, config.port);

<<<<<<< HEAD

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
=======
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

void start();
>>>>>>> main
