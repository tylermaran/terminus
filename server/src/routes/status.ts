import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { getAggregatedResources, finalizeResearch } from '../services/resources';

export const statusRouter = Router();

statusRouter.get('/', async (req: Request, res: Response) => {
  const playerId = req.player!.id;

  await finalizeResearch(playerId);

  const [bodies, totals, activeResearch, recentLogs] = await Promise.all([
    prisma.celestialBody.findMany({
      where: { ownerId: playerId },
      include: { structures: true },
    }),
    getAggregatedResources(playerId),
    prisma.research.findFirst({
      where: { playerId, completed: false },
      include: { technology: true },
    }),
    prisma.logEntry.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const now = new Date();
  const activeConstruction = bodies.flatMap((b) =>
    b.structures
      .filter((s) => s.completesAt && s.completesAt > now)
      .map((s) => ({
        bodyId: b.id,
        bodyName: b.name,
        structureType: s.type,
        completesAt: s.completesAt!.toISOString(),
      }))
  );

  const completedResearch = await prisma.research.findMany({
    where: { playerId, completed: true },
    include: { technology: true },
  });

  res.json({
    username: req.player!.username,
    bodies: bodies.map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      structures: b.structures
        .filter((s) => !s.completesAt || s.completesAt <= now)
        .map((s) => s.type),
    })),
    totalResources: {
      minerals: Math.floor(totals.minerals),
      energy: Math.floor(totals.energy),
      alloys: Math.floor(totals.alloys),
      credits: Math.floor(totals.credits),
      researchPoints: Math.floor(totals.researchPoints),
    },
    activeConstruction,
    completedResearch: completedResearch.map((r) => r.technology.name),
    activeResearch: activeResearch
      ? {
          name: activeResearch.technology.name,
          completesAt: activeResearch.completesAt.toISOString(),
        }
      : null,
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      content: l.content,
      tags: l.tags,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});
