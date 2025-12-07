import { GameState } from "./types";
import * as apiState from "./api/state";

// ═══════════════════════════════════════════════════════════════
// STATE PERSISTENCE (using DB/API abstraction)
// ═══════════════════════════════════════════════════════════════

export const getDefaultState = (): GameState => ({
  metal: 100,
  metalFactory: {
    level: 1,
    upgradeStartTime: null,
    upgradeDuration: 0,
  },
  lastUpdate: Date.now(),
});

// Re-export async functions from api/state
export const loadState = apiState.loadState;
export const saveState = apiState.saveState;

// ═══════════════════════════════════════════════════════════════
// GAME FORMULAS
// ═══════════════════════════════════════════════════════════════
export const calculateProduction = (level: number): number => {
  return Math.floor(1 * Math.pow(1.5, level - 1) * 100) / 100;
};

export const calculateUpgradeCost = (currentLevel: number): number => {
  return Math.floor(50 * Math.pow(2, currentLevel - 1));
};

export const calculateUpgradeDuration = (currentLevel: number): number => {
  return (5 + (currentLevel - 1) * 3) * 1000;
};

// ═══════════════════════════════════════════════════════════════
// TIME-BASED CALCULATIONS
// ═══════════════════════════════════════════════════════════════
export const calculateCurrentMetal = (state: GameState): number => {
  const now = Date.now();
  let metal = state.metal;

  if (state.metalFactory.upgradeStartTime !== null) {
    const upgradeEndTime =
      state.metalFactory.upgradeStartTime + state.metalFactory.upgradeDuration;

    if (now >= upgradeEndTime) {
      const productionTime = (now - upgradeEndTime) / 1000;
      const newLevel = state.metalFactory.level + 1;
      const production = calculateProduction(newLevel);
      metal += production * productionTime;
    }
  } else {
    const elapsedSeconds = (now - state.lastUpdate) / 1000;
    const production = calculateProduction(state.metalFactory.level);
    metal += production * elapsedSeconds;
  }

  return metal;
};

export const processUpgradeCompletion = (state: GameState): boolean => {
  if (state.metalFactory.upgradeStartTime === null) return false;

  const now = Date.now();
  const upgradeEndTime =
    state.metalFactory.upgradeStartTime + state.metalFactory.upgradeDuration;

  if (now >= upgradeEndTime) {
    state.metalFactory.level++;
    state.metalFactory.upgradeStartTime = null;
    state.metalFactory.upgradeDuration = 0;
    return true;
  }
  return false;
};

export const syncState = (state: GameState): { upgraded: boolean } => {
  state.metal = calculateCurrentMetal(state);
  const upgraded = processUpgradeCompletion(state);
  state.lastUpdate = Date.now();
  return { upgraded };
};

export const isUpgrading = (state: GameState): boolean => {
  return state.metalFactory.upgradeStartTime !== null;
};

export const getUpgradeProgress = (
  state: GameState
): { remaining: number; progress: number } | null => {
  if (!state.metalFactory.upgradeStartTime) return null;

  const now = Date.now();
  const elapsed = now - state.metalFactory.upgradeStartTime;
  const remaining = Math.max(0, state.metalFactory.upgradeDuration - elapsed);
  const progress = Math.min(1, elapsed / state.metalFactory.upgradeDuration);

  return { remaining, progress };
};
