import { TabName, GameState } from "./types";
import {
  loadState,
  saveState,
  syncState,
  calculateCurrentMetal,
  calculateProduction,
  calculateUpgradeCost,
  calculateUpgradeDuration,
  isUpgrading,
  getDefaultState,
} from "./state";
import { formatNumber } from "./utils";
import { createScreen, tabs } from "./ui/screen";
import { createCommandModal } from "./ui/commandModal";
import { createOverviewPage } from "./pages/overview";
import { createProductionPage } from "./pages/production";
import { createFleetPage } from "./pages/fleet";
import { createChatPage } from "./pages/chat";
import {
  createMapPage,
  getMapState,
  setZoom,
  setSelectedStar,
  setSelectedPlanet,
  getCurrentPlanets,
} from "./pages/map";
import { starSystems } from "./data/planets";
import { isServerMode } from "./api/client";
import { icons } from "./utils/icons";

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════
let state: GameState = getDefaultState();

let logMessage =
  "Welcome to Metal Factory! Use ↑↓ to navigate, Enter to select.";
let currentTab: TabName = "overview";
let commandModalOpen = false;
let renderTick = 0;

// ═══════════════════════════════════════════════════════════════
// CREATE UI
// ═══════════════════════════════════════════════════════════════
const ui = createScreen();
const { screen, tabList, resourceBar, logBox, mainContent } = ui;

const commandModal = createCommandModal(screen);

// Create pages
const overviewPage = createOverviewPage(mainContent, () => state);
const productionPage = createProductionPage(mainContent, () => state);
const fleetPage = createFleetPage(mainContent);
const chatPage = createChatPage(mainContent, screen, tabList, (msg) => {
  logMessage = msg;
});
const mapPage = createMapPage(mainContent, (msg) => {
  logMessage = msg;
});

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════
const switchTab = (tabName: TabName) => {
  currentTab = tabName;

  overviewPage.hide();
  productionPage.hide();
  fleetPage.hide();
  chatPage.hide();
  mapPage.hide();

  switch (tabName) {
    case "overview":
      overviewPage.show();
      break;
    case "production":
      productionPage.show();
      break;
    case "fleet":
      fleetPage.show();
      break;
    case "chat":
      chatPage.show();
      break;
    case "map":
      mapPage.show();
      break;
  }

  screen.render();
};

// ═══════════════════════════════════════════════════════════════
// GAME ACTIONS
// ═══════════════════════════════════════════════════════════════
const startUpgrade = async () => {
  if (isUpgrading(state)) {
    logMessage = "{#ffcc00-fg}⚠ Factory is already upgrading!{/}";
    return;
  }

  const cost = calculateUpgradeCost(state.metalFactory.level);
  const currentMetal = calculateCurrentMetal(state);

  if (currentMetal < cost) {
    logMessage = `{#ff3366-fg}✗ Not enough metal! Need ${formatNumber(
      cost
    )} metal.{/}`;
    return;
  }

  syncState(state);
  state.metal -= cost;
  state.metalFactory.upgradeStartTime = Date.now();
  state.metalFactory.upgradeDuration = calculateUpgradeDuration(
    state.metalFactory.level
  );

  await saveState(state);
  logMessage = `{#00d4ff-fg}${icons.upgrade} Upgrading factory to Level ${
    state.metalFactory.level + 1
  }...{/}`;
};

// ═══════════════════════════════════════════════════════════════
// COMMAND MODAL
// ═══════════════════════════════════════════════════════════════
const openCommandModal = () => {
  commandModalOpen = true;
  commandModal.modal.show();
  commandModal.input.focus();
  commandModal.input.setValue("");
  screen.render();
};

const closeCommandModal = () => {
  commandModalOpen = false;
  commandModal.modal.hide();
  tabList.focus();
  screen.render();
};

const executeCommand = async (cmd: string) => {
  const command = cmd.trim().toLowerCase();

  switch (command) {
    case "upgrade":
    case "u":
      await startUpgrade();
      break;
    case "save":
    case "s":
      syncState(state);
      await saveState(state);
      logMessage = "{#00ff88-fg}✓ Game saved!{/}";
      break;
    case "reset":
      const defaultState = getDefaultState();
      state.metal = defaultState.metal;
      state.metalFactory = { ...defaultState.metalFactory };
      state.lastUpdate = Date.now();
      await saveState(state);
      logMessage = "{#ffcc00-fg}Game reset to beginning!{/}";
      break;
    case "quit":
    case "q":
      syncState(state);
      await saveState(state);
      logMessage = "{#00ff88-fg}Game saved!{/}";
      render();
      setTimeout(() => process.exit(0), 200);
      return;
    case "overview":
    case "1":
      tabList.select(0);
      switchTab("overview");
      break;
    case "production":
    case "2":
      tabList.select(1);
      switchTab("production");
      break;
    case "fleet":
    case "3":
      tabList.select(2);
      switchTab("fleet");
      break;
    case "chat":
    case "4":
      tabList.select(3);
      switchTab("chat");
      break;
    case "map":
    case "5":
      tabList.select(4);
      switchTab("map");
      break;
    default:
      if (command) {
        logMessage = `{#ff3366-fg}Unknown command: ${command}{/}`;
      }
  }

  closeCommandModal();
};

commandModal.input.on("submit", (value: string) => {
  executeCommand(value).catch((err) => {
    console.error("Command execution error:", err);
    logMessage = "{#ff3366-fg}Error executing command!{/}";
  });
});

commandModal.input.on("cancel", () => {
  closeCommandModal();
});

commandModal.input.key(["escape"], () => {
  closeCommandModal();
});

commandModal.input.key(["/"], () => {
  closeCommandModal();
});

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
const render = () => {
  renderTick++;
  if (renderTick % 15 === 0) {
    mapPage.twinkle();
  }

  const { upgraded } = syncState(state);
  if (upgraded) {
    logMessage = `{#00ff88-fg}✓ Upgrade complete! Factory is now Level ${state.metalFactory.level}{/}`;
    saveState(state).catch((err) => {
      console.error("Failed to save state after upgrade:", err);
    });
  }

  const currentMetal = calculateCurrentMetal(state);
  const production = calculateProduction(state.metalFactory.level);
  const upgrading = isUpgrading(state);

  // Resource bar
  resourceBar.setContent(
    `{#b8c4ce-fg}${icons.metal} Metal:{/} {bold}{#00d4ff-fg}${formatNumber(
      currentMetal
    )}{/}  ` +
      `{#666666-fg}│{/}  ` +
      `{#666666-fg}+${production.toFixed(2)}/sec{/}` +
      (upgrading ? ` {#ffcc00-fg}(paused){/}` : "")
  );

  // Render current page
  overviewPage.render();
  productionPage.render();
  fleetPage.render();
  chatPage.render();
  mapPage.render();

  // Log
  logBox.setContent(logMessage);

  screen.render();
};

// ═══════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════
tabList.on("select", (item, index) => {
  switchTab(tabs[index].name);
});

screen.key(["/"], () => {
  if (commandModalOpen) {
    closeCommandModal();
  } else {
    openCommandModal();
  }
});

screen.key(["escape", "q", "C-c"], () => {
  if (commandModalOpen) {
    closeCommandModal();
    return;
  }
  syncState(state);
  saveState(state)
    .then(() => {
      logMessage = "{#00ff88-fg}Game saved!{/}";
      render();
      setTimeout(() => process.exit(0), 200);
    })
    .catch((err) => {
      console.error("Failed to save on exit:", err);
      setTimeout(() => process.exit(0), 200);
    });
});

screen.key(["u", "U"], () => {
  if (commandModalOpen) return;
  if (currentTab === "production") {
    startUpgrade().catch((err) => {
      console.error("Upgrade failed:", err);
      logMessage = "{#ff3366-fg}Upgrade failed!{/}";
    });
  }
});

screen.key(["s", "S"], () => {
  if (commandModalOpen) return;
  syncState(state);
  saveState(state)
    .then(() => {
      logMessage = "{#00ff88-fg}✓ Game saved!{/}";
    })
    .catch((err) => {
      console.error("Failed to save:", err);
      logMessage = "{#ff3366-fg}Failed to save!{/}";
    });
});

// Number keys for tab switching
screen.key(["1"], () => {
  if (commandModalOpen) return;
  tabList.select(0);
  switchTab("overview");
});

screen.key(["2"], () => {
  if (commandModalOpen) return;
  tabList.select(1);
  switchTab("production");
});

screen.key(["3"], () => {
  if (commandModalOpen) return;
  tabList.select(2);
  switchTab("fleet");
});

screen.key(["4"], () => {
  if (commandModalOpen) return;
  tabList.select(3);
  switchTab("chat");
});

screen.key(["5"], () => {
  if (commandModalOpen) return;
  tabList.select(4);
  switchTab("map");
});

// Map zoom controls
screen.key(["+", "="], () => {
  if (commandModalOpen || chatPage.isInputActive()) return;
  if (currentTab === "map") {
    const { currentZoom } = getMapState();
    if (currentZoom === "stars") {
      setZoom("system");
      setSelectedPlanet(0);
      logMessage = `{#00d4ff-fg}Entering ${
        starSystems[getMapState().selectedStarIndex].name
      }{/}`;
    } else if (currentZoom === "system") {
      setZoom("planet");
      logMessage = `{#00d4ff-fg}Viewing ${
        getCurrentPlanets()[getMapState().selectedPlanetIndex].name
      }{/}`;
    }
  }
});

screen.key(["-", "_"], () => {
  if (commandModalOpen || chatPage.isInputActive()) return;
  if (currentTab === "map") {
    const { currentZoom } = getMapState();
    if (currentZoom === "planet") {
      setZoom("system");
      logMessage = `{#00d4ff-fg}Viewing ${
        starSystems[getMapState().selectedStarIndex].name
      }{/}`;
    } else if (currentZoom === "system") {
      setZoom("stars");
      logMessage = "{#00d4ff-fg}Viewing galaxy map{/}";
    }
  }
});

// Tab key for map navigation
screen.key(["tab"], () => {
  if (commandModalOpen || chatPage.isInputActive()) return;
  if (currentTab === "map") {
    const { currentZoom, selectedStarIndex, selectedPlanetIndex } =
      getMapState();
    if (currentZoom === "stars") {
      setSelectedStar((selectedStarIndex + 1) % starSystems.length);
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      setSelectedPlanet((selectedPlanetIndex + 1) % planets.length);
    }
  }
});

screen.key(["S-tab"], () => {
  if (commandModalOpen || chatPage.isInputActive()) return;
  if (currentTab === "map") {
    const { currentZoom, selectedStarIndex, selectedPlanetIndex } =
      getMapState();
    if (currentZoom === "stars") {
      setSelectedStar(
        (selectedStarIndex - 1 + starSystems.length) % starSystems.length
      );
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      setSelectedPlanet(
        (selectedPlanetIndex - 1 + planets.length) % planets.length
      );
    }
  }
});

// Arrow keys for map
const handleMapArrow = (direction: "left" | "right" | "up" | "down") => {
  if (commandModalOpen || chatPage.isInputActive()) return;
  if (currentTab !== "map") return;

  const { currentZoom, selectedStarIndex, selectedPlanetIndex } = getMapState();
  const checkX =
    direction === "left"
      ? (a: number, b: number) => a < b
      : direction === "right"
      ? (a: number, b: number) => a > b
      : () => true;
  const checkY =
    direction === "up"
      ? (a: number, b: number) => a < b
      : direction === "down"
      ? (a: number, b: number) => a > b
      : () => true;
  const isHorizontal = direction === "left" || direction === "right";

  if (currentZoom === "stars") {
    const current = starSystems[selectedStarIndex];
    let closest = -1;
    let closestDist = Infinity;
    starSystems.forEach((s, i) => {
      const matchX = isHorizontal ? checkX(s.x, current.x) : true;
      const matchY = !isHorizontal ? checkY(s.y, current.y) : true;
      if (
        matchX &&
        matchY &&
        (isHorizontal ? s.x !== current.x : s.y !== current.y)
      ) {
        const dist = isHorizontal
          ? Math.abs(s.x - current.x) + Math.abs(s.y - current.y) * 0.5
          : Math.abs(s.y - current.y) + Math.abs(s.x - current.x) * 0.5;
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
    });
    if (closest >= 0) setSelectedStar(closest);
  } else if (currentZoom === "system") {
    const planets = getCurrentPlanets();
    const current = planets[selectedPlanetIndex];
    let closest = -1;
    let closestDist = Infinity;
    planets.forEach((p, i) => {
      const matchX = isHorizontal ? checkX(p.x, current.x) : true;
      const matchY = !isHorizontal ? checkY(p.y, current.y) : true;
      if (
        matchX &&
        matchY &&
        (isHorizontal ? p.x !== current.x : p.y !== current.y)
      ) {
        const dist = isHorizontal
          ? Math.abs(p.x - current.x) + Math.abs(p.y - current.y) * 0.5
          : Math.abs(p.y - current.y) + Math.abs(p.x - current.x) * 0.5;
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
    });
    if (closest >= 0) setSelectedPlanet(closest);
  }
};

screen.key(["left"], () => handleMapArrow("left"));
screen.key(["right"], () => handleMapArrow("right"));
screen.key(["up"], () => handleMapArrow("up"));
screen.key(["down"], () => handleMapArrow("down"));

// Enter for chat
screen.key(["enter"], () => {
  if (commandModalOpen || chatPage.isInputActive()) return;
  if (currentTab === "chat") {
    chatPage.openInput();
  }
});

// ═══════════════════════════════════════════════════════════════
// STATE POLLING (for server mode)
// ═══════════════════════════════════════════════════════════════
let statePollInterval: NodeJS.Timeout | null = null;

const pollState = async () => {
  if (!isServerMode()) return;

  try {
    const latestState = await loadState();
    // Only update if the server state is different
    if (latestState.lastUpdate > state.lastUpdate) {
      state = latestState;
      syncState(state);
    }
  } catch (error) {
    console.error("Failed to poll state:", error);
  }
};

const startStatePolling = () => {
  if (isServerMode() && !statePollInterval) {
    statePollInterval = setInterval(pollState, 5000); // Poll every 5 seconds
  }
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION & START
// ═══════════════════════════════════════════════════════════════
const initialize = async () => {
  try {
    // Load initial state
    state = await loadState();
    syncState(state);

    logMessage =
      "Welcome to Metal Factory! Use ↑↓ to navigate, Enter to select.";

    // Start state polling if in server mode
    startStatePolling();

    // Focus and show initial tab
    tabList.focus();
    switchTab("overview");

    // Game loop
    setInterval(render, 100);

    // Auto-save
    setInterval(async () => {
      syncState(state);
      await saveState(state).catch((err) => {
        console.error("Auto-save failed:", err);
      });
    }, 30000);

    render();
  } catch (error) {
    console.error("Initialization failed:", error);
    logMessage = "{#ff3366-fg}Failed to initialize game!{/}";
    render();
  }
};

// Start the application
initialize();
