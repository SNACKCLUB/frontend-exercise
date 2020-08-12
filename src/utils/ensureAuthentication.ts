import * as express from 'express';
import { decodeJwt } from '../jwt';
import prisma from '../prisma';

const ensureAuthentication: express.Handler = async (req, res, next) => {
  if (req.headers.authorization) {
    try {
      const jwtDecoded = decodeJwt(req.headers.authorization.replace(/Bearer /, '')) as { aud: string };
      const user = await prisma.users.findOne({ where: { id: jwtDecoded.aud } });
      if (!user) throw new Error('User not found');

      req.user = user;
      next();
      return;
    } catch (err) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
  }

  res.status(401).json({ error: 'Invalid credentials' });
  return;
};

export default ensureAuthentication;
