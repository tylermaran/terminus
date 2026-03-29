import { prisma } from '../index';
import { STRUCTURE_DEFINITIONS } from '@terminus/shared';
import type { StructureType } from '@terminus/shared';

/**
 * Recalculate resources for a single body based on elapsed time and active structures.
 * Returns the updated resource store.
 */
export async function recalculateResources(bodyId: string, playerId: string) {
  const store = await prisma.resourceStore.findUnique({
    where: { bodyId },
    include: {
      body: {
        include: { structures: true },
      },
    },
  });

  if (!store || store.playerId !== playerId) return store;

  const now = new Date();
  const elapsedHours = (now.getTime() - store.lastCalculatedAt.getTime()) / (1000 * 60 * 60);
  if (elapsedHours < 0.001) return store;

  const completedResearch = await prisma.research.findMany({
    where: { playerId, completed: true },
    select: { technologyId: true },
  });
  const completedTechIds = new Set(completedResearch.map((r) => r.technologyId));

  const richness = store.body.resourceRichness;
  let mineralRate = 0;
  let energyRate = 0;
  let alloyRate = 0;
  let researchPointRate = 0;
  let mineralConsumption = 0;

  for (const structure of store.body.structures) {
    if (structure.completesAt && structure.completesAt > now) continue;

    const def = STRUCTURE_DEFINITIONS[structure.type as StructureType];
    if (!def) continue;

    let multiplier = 1;
    if (structure.type === 'mine' && completedTechIds.has('advanced_mining')) multiplier = 2;
    if (structure.type === 'power_plant' && completedTechIds.has('energy_efficiency')) multiplier = 2;
    if (structure.type === 'refinery' && completedTechIds.has('alloy_synthesis')) multiplier = 2;

    mineralRate += (def.production.minerals || 0) * richness * multiplier;
    energyRate += (def.production.energy || 0) * richness * multiplier;
    alloyRate += (def.production.alloys || 0) * richness * multiplier;
    researchPointRate += (def.production.researchPoints || 0) * multiplier;

    let consumptionMultiplier = 1;
    if (structure.type === 'refinery' && completedTechIds.has('alloy_synthesis')) consumptionMultiplier = 0.5;
    mineralConsumption += (def.production.mineralConsumption || 0) * consumptionMultiplier;
  }

  const bodyType = store.body.type;
  let creditRate = 0;
  if (bodyType === 'planet') {
    creditRate = store.body.radius * 0.1;
  }

  const netMineralRate = mineralRate - mineralConsumption;
  let newMinerals = store.minerals + netMineralRate * elapsedHours;
  if (newMinerals < 0) newMinerals = 0;

  const updated = await prisma.resourceStore.update({
    where: { bodyId },
    data: {
      minerals: newMinerals,
      energy: store.energy + energyRate * elapsedHours,
      alloys: store.alloys + alloyRate * elapsedHours,
      credits: store.credits + creditRate * elapsedHours,
      researchPoints: store.researchPoints + researchPointRate * elapsedHours,
      lastCalculatedAt: now,
    },
  });

  return updated;
}

/**
 * Recalculate all resource stores for a player and return aggregated totals.
 */
export async function getAggregatedResources(playerId: string) {
  const stores = await prisma.resourceStore.findMany({
    where: { playerId },
    select: { bodyId: true },
  });

  let minerals = 0, energy = 0, alloys = 0, credits = 0, researchPoints = 0;

  for (const { bodyId } of stores) {
    const updated = await recalculateResources(bodyId, playerId);
    if (updated) {
      minerals += updated.minerals;
      energy += updated.energy;
      alloys += updated.alloys;
      credits += updated.credits;
      researchPoints += updated.researchPoints;
    }
  }

  return { minerals, energy, alloys, credits, researchPoints };
}

/**
 * Check and finalize any completed research for a player.
 */
export async function finalizeResearch(playerId: string) {
  const now = new Date();
  await prisma.research.updateMany({
    where: {
      playerId,
      completed: false,
      completesAt: { lte: now },
    },
    data: { completed: true },
  });
}
