import type { Request, Response } from 'express';
import { Router } from 'express';
import { prisma } from '../index';
import { recalculateResources, finalizeResearch } from '../services/resources';
import { STRUCTURE_DEFINITIONS } from '@terminus/shared';
import type { StructureType } from '@terminus/shared';

export const bodiesRouter = Router();

bodiesRouter.get('/', async (req: Request, res: Response) => {
  const { type, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  const where: Record<string, unknown> = {};
  if (type) {
    const types = Array.isArray(type) ? type : [type];
    where.type = { in: types };
  }

  const bodies = await prisma.celestialBody.findMany({
    where,
    include: {
      owner: { select: { username: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const homeBody = await prisma.celestialBody.findFirst({
    where: { ownerId: req.player!.id },
    select: { x: true, y: true, z: true },
  });

  const results = bodies.map((b) => {
    const entry: Record<string, unknown> = {
      id: b.id,
      name: b.name,
      type: b.type,
      x: Math.round(b.x * 100) / 100,
      y: Math.round(b.y * 100) / 100,
      z: Math.round(b.z * 100) / 100,
      radius: Math.round(b.radius * 100) / 100,
      resourceRichness: Math.round(b.resourceRichness * 100) / 100,
      owner: b.owner?.username || null,
    };

    if (homeBody) {
      const dx = b.x - homeBody.x;
      const dy = b.y - homeBody.y;
      const dz = b.z - homeBody.z;
      entry.distance = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100) / 100;
    }

    return entry;
  });

  if (sort === 'distance' && homeBody) {
    results.sort((a, b) => (a.distance as number) - (b.distance as number));
  } else if (sort === 'richness') {
    results.sort((a, b) => (b.resourceRichness as number) - (a.resourceRichness as number));
  }

  const total = await prisma.celestialBody.count({ where });

  res.json({ bodies: results, page, limit, total });
});

bodiesRouter.get('/:id', async (req: Request, res: Response) => {
  const body = await prisma.celestialBody.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { username: true } },
      structures: true,
    },
  });

  if (!body) {
    res.status(404).json({ error: 'Body not found' });
    return;
  }

  let resources = null;
  if (body.ownerId === req.player!.id) {
    const store = await recalculateResources(body.id, req.player!.id);
    if (store) {
      resources = {
        minerals: Math.floor(store.minerals),
        energy: Math.floor(store.energy),
        alloys: Math.floor(store.alloys),
        credits: Math.floor(store.credits),
        researchPoints: Math.floor(store.researchPoints),
      };
    }
  }

  const now = new Date();
  res.json({
    id: body.id,
    name: body.name,
    type: body.type,
    x: Math.round(body.x * 100) / 100,
    y: Math.round(body.y * 100) / 100,
    z: Math.round(body.z * 100) / 100,
    radius: Math.round(body.radius * 100) / 100,
    resourceRichness: Math.round(body.resourceRichness * 100) / 100,
    owner: body.owner?.username || null,
    structures: body.structures.map((s) => ({
      id: s.id,
      type: s.type,
      level: s.level,
      operational: !s.completesAt || s.completesAt <= now,
      completesAt: s.completesAt?.toISOString() || null,
    })),
    resources,
  });
});

bodiesRouter.post('/:id/build', async (req: Request, res: Response) => {
  const { type } = req.body;
  const playerId = req.player!.id;

  if (!type || !STRUCTURE_DEFINITIONS[type as StructureType]) {
    const validTypes = Object.keys(STRUCTURE_DEFINITIONS).join(', ');
    res.status(400).json({ error: `Invalid structure type. Valid types: ${validTypes}` });
    return;
  }

  const structType = type as StructureType;
  const def = STRUCTURE_DEFINITIONS[structType];

  const body = await prisma.celestialBody.findUnique({
    where: { id: req.params.id },
  });

  if (!body) {
    res.status(404).json({ error: 'Body not found' });
    return;
  }

  if (body.ownerId !== playerId) {
    res.status(403).json({ error: 'You do not own this body' });
    return;
  }

  if (def.prerequisiteTech) {
    await finalizeResearch(playerId);
    const hastech = await prisma.research.findFirst({
      where: { playerId, technologyId: def.prerequisiteTech, completed: true },
    });
    if (!hastech) {
      res.status(400).json({ error: `Requires technology: ${def.prerequisiteTech}` });
      return;
    }
  }

  const store = await recalculateResources(body.id, playerId);
  if (!store) {
    res.status(500).json({ error: 'No resource store found for this body' });
    return;
  }

  if (
    store.minerals < def.cost.minerals ||
    store.energy < def.cost.energy ||
    store.alloys < def.cost.alloys
  ) {
    res.status(400).json({
      error: 'Insufficient resources',
      required: def.cost,
      available: {
        minerals: Math.floor(store.minerals),
        energy: Math.floor(store.energy),
        alloys: Math.floor(store.alloys),
      },
    });
    return;
  }

  const completesAt = new Date(Date.now() + def.buildTimeSeconds * 1000);

  const [structure] = await prisma.$transaction([
    prisma.structure.create({
      data: {
        bodyId: body.id,
        type: structType,
        completesAt,
      },
    }),
    prisma.resourceStore.update({
      where: { bodyId: body.id },
      data: {
        minerals: { decrement: def.cost.minerals },
        energy: { decrement: def.cost.energy },
        alloys: { decrement: def.cost.alloys },
      },
    }),
  ]);

  res.status(201).json({
    message: `${def.name} construction started on ${body.name}`,
    structure: {
      id: structure.id,
      type: structure.type,
      completesAt: completesAt.toISOString(),
    },
  });
});
