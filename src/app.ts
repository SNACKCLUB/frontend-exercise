import { config } from 'dotenv';
config();

import { isCelebrate } from 'celebrate';
import express, { NextFunction } from 'express';
import morgan from 'morgan';
import authRouters from './auth.routers';
import opinionsRouters from './opinions.routers';

require('express-async-errors');

const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV !== 'production' ? 'dev' : 'common'));
}
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
