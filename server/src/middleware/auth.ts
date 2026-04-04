import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      player?: {
        id: string;
        username: string;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res
      .status(401)
      .json({ error: 'Missing or invalid Authorization header. Use: Bearer <api-key>' });
    return;
  }

  const apiKey = header.slice(7);
  const player = await prisma.player.findUnique({
    where: { apiKey },
    select: { id: true, username: true },
  });

  if (!player) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  req.player = player;
  next();
}
