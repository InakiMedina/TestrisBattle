import { Router } from 'express';
import authRouter from './authRouter';
import cookieJwtAuth from '../middlewares/cookieJwtAuth';
import userRoutes from './user.routes';
import { validateCreateUser } from '../middlewares/userValidation';
import { createUser } from '../controllers/user.controller';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);

apiRouter.post('/users', validateCreateUser, createUser);

apiRouter.use(cookieJwtAuth);

apiRouter.get('/testAuth', (req, res) => {
	res.status(200).send({ user: req.user })
})

apiRouter.use('/users', userRoutes);

export default apiRouter;