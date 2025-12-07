import { GameState } from "../types";
import { isServerMode, apiGetGameState, apiSaveGameState } from "./client";
import * as dbState from "../db/state";
import { getUserId, getUsername, getUserColor } from "../config/user";

// ═══════════════════════════════════════════════════════════════
// STATE ACCESS ABSTRACTION (DB or API)
// ═══════════════════════════════════════════════════════════════

export const loadState = async (): Promise<GameState> => {
  const userId = getUserId();

  if (isServerMode()) {
    try {
      return await apiGetGameState(userId);
    } catch (error) {
      console.error(
        "Failed to load state from API, falling back to default:",
        error
      );
      // Return default state if API fails
      return getDefaultState();
    }
  } else {
    const state = await dbState.loadGameState(userId);
    if (state) {
      return state;
    }
    // Create default state if none exists
    const defaultState = getDefaultState();
    const username = getUsername();
    const color = getUserColor();
    await dbState.createGameState(userId, defaultState, username, color);
    return defaultState;
  }
};

export const saveState = async (state: GameState): Promise<void> => {
  const userId = getUserId();
  const username = getUsername();
  const color = getUserColor();
  state.lastUpdate = Date.now();

  if (isServerMode()) {
    try {
      await apiSaveGameState(userId, state, username, color);
    } catch (error) {
      console.error("Failed to save state to API:", error);
      throw error;
    }
  } else {
    await dbState.saveGameState(userId, state, username, color);
  }
};

// Default state helper (same as in original state.ts)
const getDefaultState = (): GameState => ({
  metal: 100,
  metalFactory: {
    level: 1,
    upgradeStartTime: null,
    upgradeDuration: 0,
  },
  lastUpdate: Date.now(),
});
