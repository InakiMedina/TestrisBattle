import app from './app';
import config from './config/config';
import { setupSwagger } from './swagger';
import { connectDB } from './config/db';

connectDB();

setupSwagger(app, config.port);


app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});