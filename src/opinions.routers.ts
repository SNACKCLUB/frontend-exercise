import { Opinions } from '@prisma/client';
import { celebrate, Joi, Segments } from 'celebrate';
import express from 'express';
import prisma from './prisma';
import ensureAuthentication from './utils/ensureAuthentication';

const routers = express.Router();

routers.get('/opinions/:id', async (req, res) => {
  const opinion = await prisma.opinions.findOne({
    where: { id: Number(req.params.id) },
    include: { upvotes: true },
  });

  if (!opinion) {
    res.status(404).end();
    return;
  }

  res.json(opinion);
});

routers.post('/opinions/:id/vote', ensureAuthentication, async (req, res) => {
  const opinion = await prisma.opinions.findOne({
    where: { id: Number(req.params.id) },
  });

  if (!req.user) {
    res.status(401).end();
    return;
  }
  if (!opinion) {
    res.status(404).end();
    return;
  }

  try {
    const upvote = await prisma.upvotes.create({
      data: { opinion: { connect: { id: opinion.id } }, user: { connect: { id: req.user.id } } },
    });

    res.status(201).json(upvote);
  } catch (err) {
    console.warn(err.stack);
    throw new Error('Error while upvoting this opinion. It might be because you have already upvoted.');
  }
});

routers.delete('/opinions/:id/vote', ensureAuthentication, async (req, res) => {
  if (!req.user) {
    res.status(403);
    return;
  }

  try {
    await prisma.upvotes.delete({
      where: {
        opinion_id_user_id: {
          opinion_id: Number(req.params.id),
          user_id: req.user.id,
        },
      },
    });

    res.status(204).end();
  } catch (err) {
    console.warn(err.stack);
    throw new Error(
      "Error while removing your upvote on this opinion. It might be because you haven't upvoted this opinion.",
    );
  }
});

routers.get('/opinions', async (req, res) => {
  const opinions: Array<Opinions & { upvotes_count: number }> = await prisma.$queryRaw`SELECT Opinions.*,
  (
    CASE
      WHEN Upvotes.opinion_id IS NOT NULL THEN COUNT(*)
      ELSE 0
      END
    ) as upvotes_count
    from Opinions
      LEFT JOIN Upvotes on Upvotes.opinion_id = Opinions.id
    GROUP BY Opinions.id
    ORDER BY upvotes_count DESC`;

  res.json({ opinions });
});

routers.post(
  '/opinions',
  ensureAuthentication,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      title: Joi.string().required(),
      content: Joi.string().required(),
    }),
  }),
  async (req, res) => {
    const body: { title: string; content: string } = req.body;
    const opinion = await prisma.opinions.create({
      data: { title: body.title, content: body.content, user: { connect: { id: req.user?.id } } },
    });
    res.status(201).json(opinion);
  },
);

export default routers;
