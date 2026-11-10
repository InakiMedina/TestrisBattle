import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import verifyJwt from '../middlewares/verifyJwt';
import { validateCreateUser } from '../middlewares/userValidation';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/register', validateCreateUser, register);
authRouter.get('/me', verifyJwt, me);

export default authRouter;
