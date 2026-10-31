import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/apiRouter';

const app = express();

app.use(express.json());
//encoded headers
app.use(express.urlencoded({extended: true}))
//for cookies on headers
app.use(cookieParser());

app.get('/', (req, res) => res.send("<h1>Hello Wolrds</h1>"))

app.use('/api', apiRouter)

app.use(errorHandler);

export default app;