import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username || typeof username !== 'string' || username.length < 2 || username.length > 32) {
    res.status(400).json({ error: 'Username must be 2-32 characters' });
    return;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    res.status(400).json({ error: 'Username may only contain letters, numbers, hyphens, and underscores' });
    return;
  }

  const existing = await prisma.player.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  const apiKey = `tk_${uuidv4().replace(/-/g, '')}`;
  const player = await prisma.player.create({
    data: { username, apiKey },
  });

  res.status(201).json({
    message: `Welcome to Terminus, ${player.username}!`,
    apiKey: player.apiKey,
    hint: 'Store this API key securely. Use `terminus login <api-key>` to save it.',
  });
});
