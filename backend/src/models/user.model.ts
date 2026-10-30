import { Schema, model, Document } from 'mongoose';
import { IUser } from '@shared/types/user.types';

const IUserSchema = new Schema<IUser>({ /* ... */ });
export const User = model<IUser>('User', IUserSchema);