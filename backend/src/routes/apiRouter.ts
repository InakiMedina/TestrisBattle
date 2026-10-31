import { Router } from 'express';
import authRouter from './authRouter';
import cookieJwtAuth from '../middlewares/cookieJwtAuth';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);

apiRouter.use(cookieJwtAuth);

apiRouter.get('/testAuth', (req, res) => {
	res.status(200).send({ user: req.user })
})

export default apiRouter;