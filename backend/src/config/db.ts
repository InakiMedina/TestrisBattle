import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error('MONGODB_URL no está definida en el .env');
  await mongoose.connect(uri);
  console.log('MongoDB conectado');
}