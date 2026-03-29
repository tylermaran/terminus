import { Router, Request, Response } from 'express';
import { prisma } from '../index';

export const logRouter = Router();

logRouter.get('/', async (req: Request, res: Response) => {
  const playerId = req.player!.id;
  const { tag, search } = req.query;
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const page = Math.max(1, parseInt(req.query.page as string) || 1);

  const where: Record<string, unknown> = { playerId };

  if (tag && typeof tag === 'string') {
    where.tags = { has: tag };
  }

  if (search && typeof search === 'string') {
    where.content = { contains: search, mode: 'insensitive' };
  }

  const [entries, total] = await Promise.all([
    prisma.logEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.logEntry.count({ where }),
  ]);

  res.json({
    entries: entries.map((e) => ({
      id: e.id,
      content: e.content,
      tags: e.tags,
      createdAt: e.createdAt.toISOString(),
    })),
    page,
    limit,
    total,
  });
});

logRouter.post('/', async (req: Request, res: Response) => {
  const { content, tags } = req.body;

  if (!content || typeof content !== 'string' || content.length === 0) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  if (content.length > 2000) {
    res.status(400).json({ error: 'Content must be under 2000 characters' });
    return;
  }

  const tagList = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === 'string') : [];

  const entry = await prisma.logEntry.create({
    data: {
      playerId: req.player!.id,
      content,
      tags: tagList,
    },
  });

  res.status(201).json({
    message: 'Log entry recorded',
    entry: {
      id: entry.id,
      content: entry.content,
      tags: entry.tags,
      createdAt: entry.createdAt.toISOString(),
    },
  });
});
