import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import router from './routes/router';

const app = express();

app.use(express.json());

app.get('/', (req, res) => res.send("<h1>Hello Wolrds</h1>"))

app.use('/', router)

app.use(errorHandler);

export default app;