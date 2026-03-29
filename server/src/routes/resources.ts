import { Router, Request, Response } from 'express';
import { getAggregatedResources } from '../services/resources';

export const resourcesRouter = Router();

resourcesRouter.get('/', async (req: Request, res: Response) => {
  const totals = await getAggregatedResources(req.player!.id);

  res.json({
    minerals: Math.floor(totals.minerals),
    energy: Math.floor(totals.energy),
    alloys: Math.floor(totals.alloys),
    credits: Math.floor(totals.credits),
    researchPoints: Math.floor(totals.researchPoints),
  });
});
