import { config } from 'dotenv';
config();

import express, { NextFunction } from 'express';
require('express-async-errors');
import { isCelebrate } from 'celebrate';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import authRouters from './auth.routers';
import opinionsRouters from './opinions.routers';

const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV !== 'production' ? 'dev' : 'common'));
}

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(authRouters);
app.use(opinionsRouters);

app.use(function (err: Error, req: express.Request, res: express.Response, next: NextFunction) {
  // Sometimes during tests we expect the errors
  // and this console error is annoying
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  if (isCelebrate(err)) {
    res.status(500).json({
      error: err.message,
      validationError: true,
    });
    return;
  }

  res.status(500).send({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    validationError: false,
  });
});

export default app;
