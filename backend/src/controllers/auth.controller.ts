import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import config from '../config/config';

const user = {
	email: "elmasmalo@erick.sucks",
	password: "dfasdffdsa"
}

export async function login(req: Request, res: Response) {
	const { email, password } = req.body;

	if (user.email != email || user.password != password) {
		return res.status(403).json({
			error: "invalid login"
		})
	}

	const token = jwt.sign(user, config.mySecret, {expiresIn: "3h" })

	res.cookie("token", token, {
		httpOnly: true
	})

	res.status(200).json({
		msg: "succesfull login"
	})
}