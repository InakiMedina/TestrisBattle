import app from './app';
import config from './config/config';
import mongoose from 'mongoose';
import { setupSwagger } from './swagger';

// Mientras no haya Atlas, la API usa el almacén en memoria.
if (config.mongoDBURL) {
  mongoose
    .connect(config.mongoDBURL)
    .then(() => console.log('Connection Successful'))
    .catch((err) => console.error('Connection Error:', err));
}

setupSwagger(app, config.port);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
