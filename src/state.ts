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
  fleet: [],
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

// ═══════════════════════════════════════════════════════════════
// SHIP BUILDING
// ═══════════════════════════════════════════════════════════════
export interface ShipDefinition {
  name: string;
  description: string;
  cost: number;
  productionTime: number; // in milliseconds
  attack: number;
  defense: number;
}

export const SHIP_DEFINITIONS: ShipDefinition[] = [
  {
    name: "Light Fighter",
    description: "Fast and agile combat vessel",
    cost: 20000,
    productionTime: 30 * 1000, // 30 seconds
    attack: 50,
    defense: 10,
  },
  {
    name: "Heavy Fighter",
    description: "More powerful combat vessel",
    cost: 60000,
    productionTime: 60 * 1000, // 60 seconds
    attack: 150,
    defense: 25,
  },
  {
    name: "Cargo Ship",
    description: "Small transport vessel",
    cost: 15000,
    productionTime: 25 * 1000, // 25 seconds
    attack: 5,
    defense: 10,
  },
  {
    name: "Cruiser",
    description: "Medium warship with good balance",
    cost: 200000,
    productionTime: 120 * 1000, // 2 minutes
    attack: 400,
    defense: 50,
  },
  {
    name: "Battleship",
    description: "Heavy combat vessel",
    cost: 500000,
    productionTime: 240 * 1000, // 4 minutes
    attack: 1000,
    defense: 200,
  },
];

export const SHIP_COSTS: Record<string, number> = {};
SHIP_DEFINITIONS.forEach((ship) => {
  SHIP_COSTS[ship.name] = ship.cost;
});

export const getShipDefinition = (
  shipType: string
): ShipDefinition | undefined => {
  return SHIP_DEFINITIONS.find((s) => s.name === shipType);
};

export const buildShip = (
  state: GameState,
  shipType: string,
  quantity: number = 1
): { success: boolean; message: string } => {
  const shipDef = getShipDefinition(shipType);

  if (!shipDef) {
    return {
      success: false,
      message: `Unknown ship type: ${shipType}`,
    };
  }

  const totalCost = shipDef.cost * quantity;
  const currentMetal = calculateCurrentMetal(state);

  if (currentMetal < totalCost) {
    return {
      success: false,
      message: `Not enough metal! Need ${totalCost.toLocaleString()} metal.`,
    };
  }

  if (quantity <= 0) {
    return {
      success: false,
      message: `Invalid quantity: ${quantity}`,
    };
  }

  // Sync state to get current metal
  syncState(state);

  // Deduct cost
  state.metal -= totalCost;

  // Add ship to fleet
  const existingShip = state.fleet.find((s) => s.type === shipType);
  if (existingShip) {
    existingShip.count += quantity;
  } else {
    state.fleet.push({ type: shipType, count: quantity });
  }

  state.lastUpdate = Date.now();

  return {
    success: true,
    message: `Built ${quantity} ${shipType}${quantity > 1 ? "s" : ""}!`,
  };
};
