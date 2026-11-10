import type { NextFunction, Request, Response } from 'express';
import * as userService from '../services/user.services';
import type { UpdateUserInput } from '../services/user.services';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    res.json(await userService.getUsers(page, limit));
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await userService.getUserById(String(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Lista blanca: elo, league, stats y hashPass nunca se aceptan desde el cliente
    const { username, email, profilePicture, background } = req.body;
    const data: UpdateUserInput = {};
    if (username !== undefined) data.username = username.trim();
    if (email !== undefined) data.email = email.trim();
    if (profilePicture !== undefined) data.profilePicture = profilePicture;
    if (background !== undefined) data.background = background;

    res.json(await userService.updateUser(String(req.params.id), data));
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(String(req.params.id), currentPassword, newPassword);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.deleteUser(String(req.params.id), req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
