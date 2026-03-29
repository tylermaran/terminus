import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { finalizeResearch, getAggregatedResources } from '../services/resources';

export const researchRouter = Router();

researchRouter.get('/', async (req: Request, res: Response) => {
  const playerId = req.player!.id;

  await finalizeResearch(playerId);

  const technologies = await prisma.technology.findMany({
    include: { prerequisite: true },
  });

  const playerResearch = await prisma.research.findMany({
    where: { playerId },
  });

  const researchMap = new Map(playerResearch.map((r) => [r.technologyId, r]));

  const result = technologies.map((tech) => {
    const research = researchMap.get(tech.id);

    let status: string;
    if (research?.completed) {
      status = 'completed';
    } else if (research && !research.completed) {
      status = 'in_progress';
    } else if (tech.prerequisiteId && !researchMap.get(tech.prerequisiteId)?.completed) {
      status = 'locked';
    } else {
      status = 'available';
    }

    return {
      id: tech.id,
      name: tech.name,
      description: tech.description,
      category: tech.category,
      cost: tech.cost,
      durationSeconds: tech.durationSeconds,
      prerequisiteId: tech.prerequisiteId,
      prerequisiteName: tech.prerequisite?.name || null,
      status,
      ...(research && !research.completed
        ? { startedAt: research.startedAt.toISOString(), completesAt: research.completesAt.toISOString() }
        : {}),
    };
  });

  res.json({ technologies: result });
});

researchRouter.post('/:techId', async (req: Request, res: Response) => {
  const playerId = req.player!.id;
  const { techId } = req.params;

  await finalizeResearch(playerId);

  const tech = await prisma.technology.findUnique({ where: { id: techId } });
  if (!tech) {
    res.status(404).json({ error: 'Technology not found' });
    return;
  }

  const alreadyResearched = await prisma.research.findFirst({
    where: { playerId, technologyId: techId, completed: true },
  });
  if (alreadyResearched) {
    res.status(400).json({ error: 'Technology already researched' });
    return;
  }

  const inProgress = await prisma.research.findFirst({
    where: { playerId, completed: false },
    include: { technology: true },
  });
  if (inProgress) {
    res.status(400).json({
      error: `Already researching: ${inProgress.technology.name}. One research at a time.`,
      completesAt: inProgress.completesAt.toISOString(),
    });
    return;
  }

  if (tech.prerequisiteId) {
    const prereqDone = await prisma.research.findFirst({
      where: { playerId, technologyId: tech.prerequisiteId, completed: true },
    });
    if (!prereqDone) {
      res.status(400).json({ error: `Prerequisite not met: ${tech.prerequisiteId}` });
      return;
    }
  }

  const hasLab = await prisma.structure.findFirst({
    where: {
      type: 'research_lab',
      body: { ownerId: playerId },
      OR: [{ completesAt: null }, { completesAt: { lte: new Date() } }],
    },
  });
  if (!hasLab) {
    res.status(400).json({ error: 'You need an operational Research Lab to research technologies' });
    return;
  }

  const totals = await getAggregatedResources(playerId);
  if (totals.researchPoints < tech.cost) {
    res.status(400).json({
      error: 'Insufficient research points',
      required: tech.cost,
      available: Math.floor(totals.researchPoints),
    });
    return;
  }

  const stores = await prisma.resourceStore.findMany({
    where: { playerId },
    orderBy: { researchPoints: 'desc' },
  });

  let remaining = tech.cost;
  for (const store of stores) {
    if (remaining <= 0) break;
    const deduct = Math.min(store.researchPoints, remaining);
    await prisma.resourceStore.update({
      where: { id: store.id },
      data: { researchPoints: { decrement: deduct } },
    });
    remaining -= deduct;
  }

  const completesAt = new Date(Date.now() + tech.durationSeconds * 1000);
  const research = await prisma.research.create({
    data: {
      playerId,
      technologyId: techId,
      completesAt,
    },
  });

  res.status(201).json({
    message: `Research started: ${tech.name}`,
    research: {
      id: research.id,
      technologyId: techId,
      technologyName: tech.name,
      completesAt: completesAt.toISOString(),
    },
  });
});
