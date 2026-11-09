import jwt from 'jsonwebtoken';
import config from '../config/config';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUser } from '../types/auth.types';

export default (req: Request, res: Response, next: NextFunction) => {
	const token: unknown = req.cookies?.token;

	if (typeof token !== 'string') {
		return res.status(401).json({ error: 'Authentication required' });
	}

	let decoded: string | jwt.JwtPayload;
	try {
		decoded = jwt.verify(token, config.mySecret);
	} catch {
		res.clearCookie('token');
		return res.status(401).json({ error: 'Invalid or expired authentication token' });
	}

	if (typeof decoded === 'string' || typeof decoded.email !== 'string') {
		res.clearCookie('token');
		return res.status(401).json({ error: 'Invalid authentication token' });
	}

	const user: AuthenticatedUser = { email: decoded.email, username: decoded.username };
	req.user = user;
	next();
};