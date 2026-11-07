import mongoose from 'mongoose';
import config from '../config/config';

export async function connectDB(): Promise<void> {
  mongoose.connect(config.mongoDBURL)
    .then(() => console.log('Mongo connection Successful'))
    .catch((err) => console.error('Mongo connection Error:', err));
  
}