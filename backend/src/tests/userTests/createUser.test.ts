import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import * as userService from '../../services/user.services';
import { createUser } from '../../controllers/user.controller';

const mockData = {
  username: 'JohnDoe',
  email: 'jonLots@OfDoe.net',
  password: 'fdsa!78SAD',
};

function createControllerContext() {
  return {
    req: { body: mockData } as Request,
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response,
    next: jest.fn() as NextFunction,
  };
}

describe('createUser controller', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a user and returns it with status 201', async () => {
    const safeUser = {
      _id: new Types.ObjectId(),
      username: mockData.username,
      email: mockData.email,
      profilePicture: '',
      elo: 1000,
      background: '',
      league: 'Unranked',
      stats: {
        games_played: 0,
        highest_score_rank: 0,
        highest_score_solo: 0,
        lines_destroyed: 0,
        powers_used: 0,
      },
      __v: 0,
    } as Awaited<ReturnType<typeof userService.createUser>>;
    const createUserSpy = jest
      .spyOn(userService, 'createUser')
      .mockResolvedValue(safeUser);
    const { req, res, next } = createControllerContext();

    await createUser(req, res, next);

    expect(createUserSpy).toHaveBeenCalledWith(mockData);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(safeUser);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes service errors to the error handler', async () => {
    const error = new Error('Could not create user');
    const createUserSpy = jest
      .spyOn(userService, 'createUser')
      .mockRejectedValue(error);
    const { req, res, next } = createControllerContext();

    await createUser(req, res, next);

    expect(createUserSpy).toHaveBeenCalledWith(mockData);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});