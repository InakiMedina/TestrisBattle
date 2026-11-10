import express from 'express';
import cors from 'cors';
import config from './config/config';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/apiRouter';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => res.send('<h1>Hello Worlds</h1>'));

app.use('/api', apiRouter);

app.use(errorHandler);

export default app;
