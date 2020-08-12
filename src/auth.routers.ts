import bcryptjs from 'bcryptjs';
import { celebrate, Joi, Segments } from 'celebrate';
import express from 'express';
import { signJwt } from './jwt';
import prisma from './prisma';

const routers = express.Router();

routers.post(
  '/register',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      username: Joi.string().required().alphanum().min(3).max(30),
      email: Joi.string().required().email({ minDomainSegments: 2 }),
      password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')),
    }),
  }),
  async (req, res) => {
    const body: { username: string; email: string; password: string } = req.body;

    const hashedPassword = await bcryptjs.hash(body.password, 10);
    const user = await prisma.users.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    res.json(user);
  },
);

routers.post(
  '/login',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    }),
  }),
  async (req, res) => {
    const body: { username: string; password: string } = req.body;
    const user = await prisma.users.findOne({
      where: { username: body.username },
    });

    const isCorrect = await bcryptjs.compare(body.password, user?.password ?? '');

    if (!isCorrect || !user) {
      res.status(401).json({ error: 'Incorrect credentials' });
      return;
    }

    res.status(200).json({
      token: signJwt(user),
    });
  },
);
export default routers;
