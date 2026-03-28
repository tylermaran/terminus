import { prisma } from "./client";
import { GameState } from "../types";

// ═══════════════════════════════════════════════════════════════
// GAME STATE DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

export const loadGameState = async (
  userId: string
): Promise<GameState | null> => {
  try {
    const dbState = await prisma.gameState.findUnique({
      where: { userId },
    });

    if (!dbState) {
      return null;
    }

    return {
      metal: dbState.metal,
      metalFactory: {
        level: dbState.metalFactoryLevel,
        upgradeStartTime:
          dbState.metalFactoryUpgradeStartTime !== null
            ? Number(dbState.metalFactoryUpgradeStartTime)
            : null,
        upgradeDuration: Number(dbState.metalFactoryUpgradeDuration),
      },
      fleet: dbState.fleet ? JSON.parse(dbState.fleet) : [],
      lastUpdate: Number(dbState.lastUpdate),
    };
  } catch (error) {
    console.error("Failed to load game state from database:", error);
    return null;
  }
};

export const saveGameState = async (
  userId: string,
  state: GameState,
  username?: string,
  color?: string
): Promise<void> => {
  try {
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username: username || `User_${userId.substring(0, 8)}`,
        color: color || "#00ff88",
      },
      update: {
        // Update username/color if provided
        ...(username && { username }),
        ...(color && { color }),
      },
    });

    await prisma.gameState.upsert({
      where: { userId },
      create: {
        userId,
        metal: state.metal,
        metalFactoryLevel: state.metalFactory.level,
        metalFactoryUpgradeStartTime:
          state.metalFactory.upgradeStartTime !== null
            ? BigInt(state.metalFactory.upgradeStartTime)
            : null,
        metalFactoryUpgradeDuration: BigInt(state.metalFactory.upgradeDuration),
        fleet: JSON.stringify(state.fleet || []),
        lastUpdate: BigInt(state.lastUpdate),
      },
      update: {
        metal: state.metal,
        metalFactoryLevel: state.metalFactory.level,
        metalFactoryUpgradeStartTime:
          state.metalFactory.upgradeStartTime !== null
            ? BigInt(state.metalFactory.upgradeStartTime)
            : null,
        metalFactoryUpgradeDuration: BigInt(state.metalFactory.upgradeDuration),
        fleet: JSON.stringify(state.fleet || []),
        lastUpdate: BigInt(state.lastUpdate),
      },
    });
  } catch (error) {
    console.error("Failed to save game state to database:", error);
    throw error;
  }
};

export const createGameState = async (
  userId: string,
  state: GameState,
  username?: string,
  color?: string
): Promise<void> => {
  try {
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username: username || `User_${userId.substring(0, 8)}`,
        color: color || "#00ff88",
      },
      update: {},
    });

    await prisma.gameState.create({
      data: {
        userId,
        metal: state.metal,
        metalFactoryLevel: state.metalFactory.level,
        metalFactoryUpgradeStartTime:
          state.metalFactory.upgradeStartTime !== null
            ? BigInt(state.metalFactory.upgradeStartTime)
            : null,
        metalFactoryUpgradeDuration: BigInt(state.metalFactory.upgradeDuration),
        fleet: JSON.stringify(state.fleet || []),
        lastUpdate: BigInt(state.lastUpdate),
      },
    });
  } catch (error) {
    console.error("Failed to create game state in database:", error);
    throw error;
  }
};
