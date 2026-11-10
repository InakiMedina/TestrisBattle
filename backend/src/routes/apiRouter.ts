import { Router } from 'express';
import authRouter from './authRouter';
import userRoutes from './user.routes';
import verifyJwt from '../middlewares/verifyJwt';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);

apiRouter.get('/testAuth', verifyJwt, (req, res) => {
  res.status(200).send({ user: req.user });
});

apiRouter.use('/users', verifyJwt, userRoutes);

export default apiRouter;
