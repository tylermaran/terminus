import type { Request, Response } from 'express';
import { Router } from 'express';
import { prisma } from '../index';

export const feedbackRouter = Router();

const VALID_TYPES = ['bug', 'feature', 'gameplay'];

feedbackRouter.post('/', async (req: Request, res: Response) => {
  const { content, type } = req.body;

  if (!content || typeof content !== 'string' || content.length === 0) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  if (content.length > 2000) {
    res.status(400).json({ error: 'Feedback must be under 2000 characters' });
    return;
  }

  const feedbackType = type || 'gameplay';
  if (!VALID_TYPES.includes(feedbackType)) {
    res.status(400).json({ error: `Invalid type. Valid types: ${VALID_TYPES.join(', ')}` });
    return;
  }

  const [entry] = await prisma.$transaction([
    prisma.feedback.create({
      data: {
        playerId: req.player!.id,
        type: feedbackType,
        content,
      },
    }),
    prisma.logEntry.create({
      data: {
        playerId: req.player!.id,
        content: `Submitted feedback [${feedbackType}] ${content}`,
        tags: ['feedback', feedbackType],
      },
    }),
  ]);

  res.status(201).json({
    message: `Thanks for the feedback! [${feedbackType}] (also recorded in captain's log)`,
    feedback: {
      id: entry.id,
      type: entry.type,
      content: entry.content,
      createdAt: entry.createdAt.toISOString(),
    },
  });
});
