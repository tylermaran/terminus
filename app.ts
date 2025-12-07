import blessed from "blessed";
import contrib from "blessed-contrib";
import fs from "fs";
import path from "path";

// ═══════════════════════════════════════════════════════════════
// STATE TYPES & FILE PERSISTENCE
// ═══════════════════════════════════════════════════════════════
interface GameState {
  metal: number;
  metalFactory: {
    level: number;
    upgradeStartTime: number | null;
    upgradeDuration: number;
  };
  lastUpdate: number;
}

const STATE_FILE = path.join(process.cwd(), "state.json");

const getDefaultState = (): GameState => ({
  metal: 100,
  metalFactory: {
    level: 1,
    upgradeStartTime: null,
    upgradeDuration: 0,
  },
  lastUpdate: Date.now(),
});

const loadState = (): GameState => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, "utf-8");
      const loaded = JSON.parse(data) as GameState;
      return loaded;
    }
  } catch (err) {
    console.error("Failed to load state, starting fresh:", err);
  }
  return getDefaultState();
};

const saveState = (state: GameState): void => {
  try {
    state.lastUpdate = Date.now();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Failed to save state:", err);
  }
};

// ═══════════════════════════════════════════════════════════════
// GAME FORMULAS
// ═══════════════════════════════════════════════════════════════
const calculateProduction = (level: number): number => {
  return Math.floor(1 * Math.pow(1.5, level - 1) * 100) / 100;
};

const calculateUpgradeCost = (currentLevel: number): number => {
  return Math.floor(50 * Math.pow(2, currentLevel - 1));
};

const calculateUpgradeDuration = (currentLevel: number): number => {
  return (5 + (currentLevel - 1) * 3) * 1000;
};

// ═══════════════════════════════════════════════════════════════
// TIME-BASED CALCULATIONS
// ═══════════════════════════════════════════════════════════════
const calculateCurrentMetal = (state: GameState): number => {
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

const processUpgradeCompletion = (state: GameState): boolean => {
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

const syncState = (state: GameState): { upgraded: boolean } => {
  state.metal = calculateCurrentMetal(state);
  const upgraded = processUpgradeCompletion(state);
  state.lastUpdate = Date.now();
  return { upgraded };
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZE STATE
// ═══════════════════════════════════════════════════════════════
const state = loadState();
const syncResult = syncState(state);

function formatTimeAway(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

let logMessage =
  "Welcome to Metal Factory! Use ↑↓ to navigate, Enter to select.";

// ═══════════════════════════════════════════════════════════════
// SCREEN SETUP
// ═══════════════════════════════════════════════════════════════
const screen = blessed.screen({
  smartCSR: true,
  title: "⛏ METAL FACTORY",
});

// ═══════════════════════════════════════════════════════════════
// TAB STATE
// ═══════════════════════════════════════════════════════════════
type TabName = "overview" | "production" | "fleet" | "chat" | "map";
let currentTab: TabName = "overview";

const tabs: { name: TabName; label: string; icon: string }[] = [
  { name: "overview", label: "Overview", icon: "◈" },
  { name: "production", label: "Production", icon: "⛏" },
  { name: "fleet", label: "Fleet", icon: "🚀" },
  { name: "chat", label: "Chat", icon: "💬" },
  { name: "map", label: "Map", icon: "🌍" },
];

// Demo chat data
interface ChatMessage {
  user: string;
  color: string;
  message: string;
  time: string;
}

const chatMessages: ChatMessage[] = [
  {
    user: "StarLord_42",
    color: "#ff6b35",
    message: "anyone want to form an alliance?",
    time: "14:22",
  },
  {
    user: "NebulaCrusher",
    color: "#00ff88",
    message: "just hit level 15 metal factory 🎉",
    time: "14:23",
  },
  {
    user: "VoidWalker",
    color: "#cc66ff",
    message: "nice! i'm still grinding level 10",
    time: "14:24",
  },
  {
    user: "CosmicQueen",
    color: "#00d4ff",
    message: "anyone have extra deuterium for trade?",
    time: "14:25",
  },
  {
    user: "StarLord_42",
    color: "#ff6b35",
    message: "I can spare 50k, what are you offering?",
    time: "14:26",
  },
  {
    user: "DarkMatter99",
    color: "#ffcc00",
    message: "⚠️ heads up - fleet spotted at [2:84:6]",
    time: "14:28",
  },
  {
    user: "NebulaCrusher",
    color: "#00ff88",
    message: "thanks for the warning!",
    time: "14:28",
  },
  {
    user: "CosmicQueen",
    color: "#00d4ff",
    message: "I have 100k crystal, 2:1 ratio?",
    time: "14:29",
  },
  {
    user: "VoidWalker",
    color: "#cc66ff",
    message: "that's a good deal ^",
    time: "14:30",
  },
];

// Solar system map data
interface Planet {
  name: string;
  symbol: string;
  color: string;
  x: number; // position in the map (0-100 percentage)
  y: number;
  size: "small" | "medium" | "large";
  info: string;
}

const solarSystem: Planet[] = [
  {
    name: "Sol",
    symbol: "☀",
    color: "#ffcc00",
    x: 50,
    y: 50,
    size: "large",
    info: "The star at the center of the system",
  },
  {
    name: "Mercury",
    symbol: "●",
    color: "#888888",
    x: 58,
    y: 48,
    size: "small",
    info: "Hot, barren world - minimal resources",
  },
  {
    name: "Venus",
    symbol: "◉",
    color: "#ffaa00",
    x: 64,
    y: 55,
    size: "small",
    info: "Toxic atmosphere - deuterium deposits",
  },
  {
    name: "Terra Prime",
    symbol: "◎",
    color: "#00d4ff",
    x: 72,
    y: 45,
    size: "medium",
    info: "Your homeworld - fully colonized",
  },
  {
    name: "Luna",
    symbol: "◌",
    color: "#cccccc",
    x: 75,
    y: 42,
    size: "small",
    info: "Moon colony - titanium mining",
  },
  {
    name: "Mars",
    symbol: "◉",
    color: "#ff6b35",
    x: 80,
    y: 58,
    size: "medium",
    info: "Red planet - iron ore deposits",
  },
  {
    name: "Asteroid Belt",
    symbol: "∴",
    color: "#666666",
    x: 88,
    y: 50,
    size: "small",
    info: "Rich in minerals - dangerous navigation",
  },
  {
    name: "Jupiter",
    symbol: "⬤",
    color: "#ffaa66",
    x: 20,
    y: 35,
    size: "large",
    info: "Gas giant - helium-3 harvesting",
  },
  {
    name: "Europa",
    symbol: "○",
    color: "#aaddff",
    x: 24,
    y: 30,
    size: "small",
    info: "Ice moon - subsurface ocean",
  },
  {
    name: "Saturn",
    symbol: "⬤",
    color: "#ddbb77",
    x: 15,
    y: 65,
    size: "large",
    info: "Ringed giant - research station",
  },
  {
    name: "Titan",
    symbol: "◐",
    color: "#ffdd88",
    x: 12,
    y: 70,
    size: "small",
    info: "Hydrocarbon seas - fuel production",
  },
  {
    name: "Uranus",
    symbol: "◯",
    color: "#88dddd",
    x: 85,
    y: 25,
    size: "medium",
    info: "Ice giant - unexplored",
  },
  {
    name: "Neptune",
    symbol: "◯",
    color: "#4466ff",
    x: 90,
    y: 75,
    size: "medium",
    info: "Deep space outpost",
  },
];

// Star systems (galaxy view)
interface StarSystem {
  name: string;
  color: string;
  x: number;
  y: number;
  type: "yellow" | "red" | "blue" | "white" | "orange";
  planets: Planet[];
}

const starSystems: StarSystem[] = [
  {
    name: "Sol System",
    color: "#ffcc00",
    x: 50,
    y: 50,
    type: "yellow",
    planets: solarSystem,
  },
  {
    name: "Alpha Centauri",
    color: "#ffaa00",
    x: 35,
    y: 30,
    type: "orange",
    planets: [
      {
        name: "Proxima b",
        symbol: "◎",
        color: "#ff6b35",
        x: 45,
        y: 50,
        size: "medium",
        info: "Potentially habitable - unexplored",
      },
      {
        name: "Centauri Prime",
        symbol: "◉",
        color: "#00ff88",
        x: 60,
        y: 45,
        size: "large",
        info: "Lush jungle world - alien ruins",
      },
      {
        name: "Dust Ring",
        symbol: "∴",
        color: "#888888",
        x: 75,
        y: 55,
        size: "small",
        info: "Dense asteroid field",
      },
    ],
  },
  {
    name: "Sirius",
    color: "#aaccff",
    x: 75,
    y: 25,
    type: "blue",
    planets: [
      {
        name: "Sirius I",
        symbol: "●",
        color: "#4466ff",
        x: 55,
        y: 50,
        size: "small",
        info: "Frozen wasteland",
      },
      {
        name: "Sirius II",
        symbol: "◯",
        color: "#88ddff",
        x: 70,
        y: 45,
        size: "medium",
        info: "Ice giant - rich in helium-3",
      },
    ],
  },
  {
    name: "Betelgeuse",
    color: "#ff4444",
    x: 20,
    y: 70,
    type: "red",
    planets: [
      {
        name: "Ember",
        symbol: "◉",
        color: "#ff6600",
        x: 40,
        y: 50,
        size: "large",
        info: "Volcanic world - rare minerals",
      },
      {
        name: "Cinder",
        symbol: "●",
        color: "#aa4400",
        x: 55,
        y: 55,
        size: "small",
        info: "Scorched rock",
      },
      {
        name: "Ash Station",
        symbol: "□",
        color: "#666666",
        x: 70,
        y: 48,
        size: "small",
        info: "Abandoned mining outpost",
      },
    ],
  },
  {
    name: "Vega",
    color: "#ffffff",
    x: 80,
    y: 65,
    type: "white",
    planets: [
      {
        name: "Vega Prime",
        symbol: "◎",
        color: "#ddddff",
        x: 50,
        y: 50,
        size: "large",
        info: "Advanced civilization - trading hub",
      },
      {
        name: "Vega II",
        symbol: "◌",
        color: "#aaaacc",
        x: 65,
        y: 45,
        size: "medium",
        info: "Research colony",
      },
    ],
  },
  {
    name: "Tau Ceti",
    color: "#ffdd88",
    x: 60,
    y: 80,
    type: "yellow",
    planets: [
      {
        name: "New Eden",
        symbol: "◎",
        color: "#00dd88",
        x: 50,
        y: 50,
        size: "medium",
        info: "Earth-like paradise",
      },
      {
        name: "Tau Station",
        symbol: "□",
        color: "#888888",
        x: 60,
        y: 55,
        size: "small",
        info: "Space station - refueling depot",
      },
    ],
  },
  {
    name: "Barnard's Star",
    color: "#ff8866",
    x: 15,
    y: 35,
    type: "red",
    planets: [
      {
        name: "Barnard b",
        symbol: "●",
        color: "#664444",
        x: 55,
        y: 50,
        size: "small",
        info: "Cold super-Earth",
      },
    ],
  },
];

// Zoom levels
type ZoomLevel = "stars" | "system" | "planet";
let currentZoom: ZoomLevel = "system";
let selectedStarIndex = 0; // Sol System
let selectedPlanetIndex = 3; // Start with Terra Prime selected

// Get current system's planets
const getCurrentPlanets = (): Planet[] => {
  return starSystems[selectedStarIndex].planets;
};

// Generate starfield (random positions for periods)
const generateStarfield = (width: number, height: number): string[][] => {
  const field: string[][] = [];
  for (let y = 0; y < height; y++) {
    field[y] = [];
    for (let x = 0; x < width; x++) {
      // ~3% chance of a star
      if (Math.random() < 0.03) {
        // Different star brightness
        const r = Math.random();
        if (r < 0.6) field[y][x] = ".";
        else if (r < 0.85) field[y][x] = "·";
        else if (r < 0.95) field[y][x] = "+";
        else field[y][x] = "*";
      } else {
        field[y][x] = " ";
      }
    }
  }
  return field;
};

// Pre-generate starfield (will regenerate on resize)
let starfield: string[][] = generateStarfield(80, 25);

// Star twinkle effect - slow animation
let renderTick = 0;
const twinkleStars = () => {
  // Twinkle ~5% of existing stars
  for (let y = 0; y < starfield.length; y++) {
    for (let x = 0; x < (starfield[y]?.length || 0); x++) {
      const char = starfield[y][x];
      if (char !== " " && Math.random() < 0.05) {
        // Randomly change star brightness
        const r = Math.random();
        if (r < 0.4) starfield[y][x] = ".";
        else if (r < 0.7) starfield[y][x] = "·";
        else if (r < 0.9) starfield[y][x] = "+";
        else starfield[y][x] = "*";
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// LAYOUT - Using manual positioning for more control
// ═══════════════════════════════════════════════════════════════

// Header
const header = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: "100%",
  height: 3,
  content: "{bold}{#00d4ff-fg}⛏  METAL FACTORY  ⛏{/}",
  tags: true,
  align: "center",
  valign: "middle",
  style: {
    fg: "white",
    bg: "#0d0d18",
  },
});

// Resource bar (always visible at top)
const resourceBar = blessed.box({
  parent: screen,
  top: 3,
  left: 0,
  width: "100%",
  height: 3,
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
  },
  padding: { left: 1, right: 1 },
});

// Sidebar
const sidebar = blessed.box({
  parent: screen,
  top: 6,
  left: 0,
  width: 20,
  height: "100%-17",
  label: " {bold}MENU{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
});

// Tab list inside sidebar
const tabList = blessed.list({
  parent: sidebar,
  top: 0,
  left: 0,
  width: "100%-2",
  height: "100%-2",
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: "#888888",
    selected: {
      fg: "#00d4ff",
      bold: true,
    },
    item: {
      fg: "#888888",
    },
  },
  items: tabs.map((t, i) => `  ${t.icon} ${t.label} {#666666-fg}[${i + 1}]{/}`),
});

// Controls (bottom of sidebar area)
const controlsBox = blessed.box({
  parent: screen,
  bottom: 2,
  left: 0,
  width: 20,
  height: 9,
  label: " {bold}⌨ CONTROLS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "#888888",
    border: { fg: "#1a4a6e" },
    label: { fg: "#666666" },
  },
  padding: { left: 1, right: 1 },
});

controlsBox.setContent(
  `{#ffcc00-fg}[/]{/} Command\n\n` +
    `{#00ff88-fg}[U]{/} Upgrade\n` +
    `{#00d4ff-fg}[S]{/} Save\n` +
    `{#ff3366-fg}[Q]{/} Quit`
);

// Main content area
const mainContent = blessed.box({
  parent: screen,
  top: 6,
  left: 20,
  width: "100%-20",
  height: "100%-8",
  tags: true,
});

// Log bar at bottom
const logBox = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: "100%",
  height: 2,
  tags: true,
  style: {
    fg: "#666666",
    bg: "#0a0a12",
  },
  padding: { left: 1 },
});

// ═══════════════════════════════════════════════════════════════
// COMMAND MODAL
// ═══════════════════════════════════════════════════════════════
const commandModal = blessed.box({
  parent: screen,
  top: "center",
  left: "center",
  width: 60,
  height: 12,
  label: " {bold}⌘ COMMAND{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    bg: "#0d0d18",
    border: { fg: "#00d4ff" },
    label: { fg: "#00d4ff" },
  },
  padding: { left: 1, right: 1 },
  hidden: true,
});

const commandInput = blessed.textbox({
  parent: commandModal,
  top: 0,
  left: 0,
  width: "100%-2",
  height: 3,
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    bg: "#1a1a2e",
    border: { fg: "#1a4a6e" },
    focus: {
      border: { fg: "#00d4ff" },
    },
  },
  inputOnFocus: true,
});

const commandHints = blessed.box({
  parent: commandModal,
  top: 4,
  left: 0,
  width: "100%-2",
  height: 5,
  tags: true,
  style: {
    fg: "#666666",
  },
});

commandHints.setContent(
  `{#666666-fg}Commands:{/} {#00ff88-fg}upgrade{/} {#00d4ff-fg}save{/} {#ff6b35-fg}reset{/} {#ff3366-fg}quit{/}\n` +
    `{#666666-fg}Tabs:{/} {#00d4ff-fg}overview{/} {#00d4ff-fg}production{/} {#00d4ff-fg}fleet{/} {#00d4ff-fg}chat{/} {#00d4ff-fg}map{/}`
);

let commandModalOpen = false;

const openCommandModal = () => {
  commandModalOpen = true;
  commandModal.show();
  commandInput.focus();
  commandInput.setValue("");
  screen.render();
};

const closeCommandModal = () => {
  commandModalOpen = false;
  commandModal.hide();
  tabList.focus();
  screen.render();
};

const executeCommand = (cmd: string) => {
  const command = cmd.trim().toLowerCase();

  switch (command) {
    case "upgrade":
    case "u":
      startUpgrade();
      break;
    case "save":
    case "s":
      syncState(state);
      saveState(state);
      logMessage = "{#00ff88-fg}✓ Game saved!{/}";
      break;
    case "reset":
      // Reset to default state
      const defaultState = getDefaultState();
      state.metal = defaultState.metal;
      state.metalFactory = { ...defaultState.metalFactory };
      state.lastUpdate = Date.now();
      saveState(state);
      logMessage = "{#ffcc00-fg}Game reset to beginning!{/}";
      break;
    case "quit":
    case "q":
      syncState(state);
      saveState(state);
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

// Command input handlers
commandInput.on("submit", (value: string) => {
  executeCommand(value);
});

commandInput.on("cancel", () => {
  closeCommandModal();
});

commandInput.key(["escape"], () => {
  closeCommandModal();
});

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════
const overviewContainer = blessed.box({
  parent: mainContent,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  hidden: false,
});

// Overview - Production Summary
const overviewProduction = blessed.box({
  parent: overviewContainer,
  top: 0,
  left: 0,
  width: "50%",
  height: "50%",
  label: " {bold}⛏ PRODUCTION{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#b8c4ce" },
  },
  padding: { left: 1, right: 1 },
});

// Overview - Planets
const overviewPlanets = blessed.box({
  parent: overviewContainer,
  top: 0,
  left: "50%",
  width: "50%",
  height: "50%",
  label: " {bold}🌍 PLANETS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00ff88" },
  },
  padding: { left: 1, right: 1 },
});

// Overview - Fleet
const overviewFleet = blessed.box({
  parent: overviewContainer,
  top: "50%",
  left: 0,
  width: "50%",
  height: "50%",
  label: " {bold}🚀 FLEET{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#ff6b35" },
  },
  padding: { left: 1, right: 1 },
});

// Overview - Research
const overviewResearch = blessed.box({
  parent: overviewContainer,
  top: "50%",
  left: "50%",
  width: "50%",
  height: "50%",
  label: " {bold}🔬 RESEARCH{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#cc66ff" },
  },
  padding: { left: 1, right: 1 },
});

// ═══════════════════════════════════════════════════════════════
// PRODUCTION TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════
const productionContainer = blessed.box({
  parent: mainContent,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  hidden: true,
});

// Metal ledger
const metalBox = blessed.box({
  parent: productionContainer,
  top: 0,
  left: 0,
  width: "50%",
  height: 7,
  label: " {bold}◈ METAL LEDGER{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#b8c4ce" },
  },
  padding: { left: 1, right: 1 },
});

// Factory status
const factoryBox = blessed.box({
  parent: productionContainer,
  top: 0,
  left: "50%",
  width: "50%",
  height: 7,
  label: " {bold}🏭 FACTORY STATUS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#ff6b35" },
  },
  padding: { left: 1, right: 1 },
});

// Upgrade panel
const upgradeBox = blessed.box({
  parent: productionContainer,
  top: 7,
  left: 0,
  width: "100%",
  height: "100%-7",
  label: " {bold}⬆ UPGRADE{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00ff88" },
  },
  padding: { left: 1, right: 1 },
});

// ═══════════════════════════════════════════════════════════════
// FLEET TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════
const fleetContainer = blessed.box({
  parent: mainContent,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  hidden: true,
});

// Fleet - Ship Hangar
const fleetHangar = blessed.box({
  parent: fleetContainer,
  top: 0,
  left: 0,
  width: "50%",
  height: "60%",
  label: " {bold}🛸 SHIP HANGAR{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#ff6b35" },
  },
  padding: { left: 1, right: 1 },
});

// Fleet - Active Missions
const fleetMissions = blessed.box({
  parent: fleetContainer,
  top: 0,
  left: "50%",
  width: "50%",
  height: "60%",
  label: " {bold}📡 ACTIVE MISSIONS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
  padding: { left: 1, right: 1 },
});

// Fleet - Shipyard
const fleetShipyard = blessed.box({
  parent: fleetContainer,
  top: "60%",
  left: 0,
  width: "100%",
  height: "40%",
  label: " {bold}🔧 SHIPYARD{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00ff88" },
  },
  padding: { left: 1, right: 1 },
});

// ═══════════════════════════════════════════════════════════════
// CHAT TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════
const chatContainer = blessed.box({
  parent: mainContent,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  hidden: true,
});

// Chat - Message Area
const chatMessages_box = blessed.box({
  parent: chatContainer,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%-5",
  label: " {bold}💬 GENERAL CHAT{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
  padding: { left: 1, right: 1 },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    style: {
      bg: "#1a4a6e",
    },
  },
});

// Chat - Input Area
const chatInputBox = blessed.box({
  parent: chatContainer,
  bottom: 0,
  left: 0,
  width: "100%",
  height: 5,
  label: " {bold}MESSAGE{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#666666" },
  },
});

const chatInput = blessed.textbox({
  parent: chatInputBox,
  top: 0,
  left: 1,
  width: "100%-4",
  height: 1,
  tags: true,
  style: {
    fg: "white",
    bg: "#1a1a2e",
  },
  inputOnFocus: true,
});

const chatInputHint = blessed.box({
  parent: chatInputBox,
  bottom: 0,
  left: 1,
  width: "100%-4",
  height: 1,
  tags: true,
  content: "{#666666-fg}Press Enter to send, Esc to cancel{/}",
  style: {
    fg: "#666666",
  },
});

let chatInputActive = false;

const openChatInput = () => {
  chatInputActive = true;
  chatInput.focus();
  chatInput.setValue("");
  chatInputBox.style.border.fg = "#00d4ff";
  screen.render();
};

const closeChatInput = () => {
  chatInputActive = false;
  chatInputBox.style.border.fg = "#1a4a6e";
  tabList.focus();
  screen.render();
};

const sendChatMessage = (message: string) => {
  if (message.trim()) {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    chatMessages.push({
      user: "You",
      color: "#00ff88",
      message: message.trim(),
      time,
    });
    logMessage = "{#00ff88-fg}Message sent!{/}";
  }
  // Clear input and keep focus for next message
  chatInput.clearValue();
  chatInput.focus();
  screen.render();
};

// Chat input handlers
chatInput.on("submit", (value: string) => {
  sendChatMessage(value);
});

chatInput.on("cancel", () => {
  closeChatInput();
});

chatInput.key(["escape"], () => {
  closeChatInput();
});

// ═══════════════════════════════════════════════════════════════
// MAP TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════
const mapContainer = blessed.box({
  parent: mainContent,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  hidden: true,
});

// Map - Solar System View
const mapView = blessed.box({
  parent: mapContainer,
  top: 0,
  left: 0,
  width: "100%-25",
  height: "100%",
  label: " {bold}🌌 SOLAR SYSTEM{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    bg: "#000005",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
});

// Map - Planet Info Panel
const mapInfo = blessed.box({
  parent: mapContainer,
  top: 0,
  right: 0,
  width: 25,
  height: "60%",
  label: " {bold}PLANET INFO{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#ffcc00" },
  },
  padding: { left: 1, right: 1 },
});

// Map - Controls/Legend
const mapControls = blessed.box({
  parent: mapContainer,
  top: "60%",
  right: 0,
  width: 25,
  height: "40%",
  label: " {bold}CONTROLS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "#888888",
    border: { fg: "#1a4a6e" },
    label: { fg: "#666666" },
  },
  padding: { left: 1, right: 1 },
});

// Controls content is set dynamically in render

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const formatNumber = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "M";
  if (n >= 1000) return (n / 1000).toFixed(2) + "K";
  return n.toFixed(1);
};

const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const progressBar = (pct: number, width: number = 30): string => {
  const filled = Math.floor(pct * width);
  const empty = width - filled;
  return `{#00ff88-fg}${"█".repeat(filled)}{/}{#333333-fg}${"░".repeat(
    empty
  )}{/}`;
};

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════
const switchTab = (tabName: TabName) => {
  currentTab = tabName;

  // Hide all containers
  overviewContainer.hide();
  productionContainer.hide();
  fleetContainer.hide();
  chatContainer.hide();
  mapContainer.hide();

  // Show selected container
  switch (tabName) {
    case "overview":
      overviewContainer.show();
      break;
    case "production":
      productionContainer.show();
      break;
    case "fleet":
      fleetContainer.show();
      break;
    case "chat":
      chatContainer.show();
      break;
    case "map":
      mapContainer.show();
      break;
  }

  screen.render();
};

// ═══════════════════════════════════════════════════════════════
// GAME ACTIONS
// ═══════════════════════════════════════════════════════════════
const isUpgrading = (): boolean => {
  return state.metalFactory.upgradeStartTime !== null;
};

const getUpgradeProgress = (): {
  remaining: number;
  progress: number;
} | null => {
  if (!state.metalFactory.upgradeStartTime) return null;

  const now = Date.now();
  const elapsed = now - state.metalFactory.upgradeStartTime;
  const remaining = Math.max(0, state.metalFactory.upgradeDuration - elapsed);
  const progress = Math.min(1, elapsed / state.metalFactory.upgradeDuration);

  return { remaining, progress };
};

const startUpgrade = () => {
  if (isUpgrading()) {
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

  saveState(state);
  logMessage = `{#00d4ff-fg}⚙ Upgrading factory to Level ${
    state.metalFactory.level + 1
  }...{/}`;
};

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
const render = () => {
  // Increment tick and twinkle stars every ~1.5 seconds (15 ticks at 100ms)
  renderTick++;
  if (renderTick % 15 === 0) {
    twinkleStars();
  }

  const { upgraded } = syncState(state);
  if (upgraded) {
    logMessage = `{#00ff88-fg}✓ Upgrade complete! Factory is now Level ${state.metalFactory.level}{/}`;
    saveState(state);
  }

  const currentMetal = calculateCurrentMetal(state);
  const production = calculateProduction(state.metalFactory.level);
  const upgrading = isUpgrading();

  // Resource bar (always visible)
  resourceBar.setContent(
    `{#b8c4ce-fg}⛏ Metal:{/} {bold}{#00d4ff-fg}${formatNumber(
      currentMetal
    )}{/}  ` +
      `{#666666-fg}│{/}  ` +
      `{#666666-fg}+${production.toFixed(2)}/sec{/}` +
      (upgrading ? ` {#ffcc00-fg}(paused){/}` : "")
  );

  // ═══════════════════════════════════════════════════════════════
  // OVERVIEW TAB CONTENT
  // ═══════════════════════════════════════════════════════════════
  // Production summary
  let prodSummary =
    `\n{#b8c4ce-fg}Metal Factory{/} {#666666-fg}Lvl {/}{#00d4ff-fg}${state.metalFactory.level}{/}\n` +
    `{#666666-fg}Output: {#00ff88-fg}+${production.toFixed(2)}/sec{/}\n`;

  if (upgrading) {
    const progress = getUpgradeProgress();
    if (progress) {
      prodSummary += `\n{#ffcc00-fg}⚙ Upgrading... ${formatTime(
        progress.remaining
      )}{/}`;
    }
  }
  overviewProduction.setContent(prodSummary);

  // Planets placeholder
  overviewPlanets.setContent(
    `\n{#666666-fg}No planets discovered yet.\n\n` +
      `{#444444-fg}Coming soon...{/}`
  );

  // Fleet placeholder
  overviewFleet.setContent(
    `\n{#666666-fg}No ships constructed yet.\n\n` +
      `{#444444-fg}Coming soon...{/}`
  );

  // Research placeholder
  overviewResearch.setContent(
    `\n{#666666-fg}No research available yet.\n\n` +
      `{#444444-fg}Coming soon...{/}`
  );

  // ═══════════════════════════════════════════════════════════════
  // PRODUCTION TAB CONTENT
  // ═══════════════════════════════════════════════════════════════
  // Metal ledger
  const metalContent =
    `\n{bold}{#b8c4ce-fg}⛏  TOTAL METAL{/}\n\n` +
    `   {bold}{#00d4ff-fg}${formatNumber(currentMetal)}{/}`;
  metalBox.setContent(metalContent);

  // Factory status
  let factoryContent =
    `\n{#ff6b35-fg}Level:{/} {bold}${state.metalFactory.level}{/}\n` +
    `{#666666-fg}Output:{/} {#b8c4ce-fg}${production.toFixed(2)}/sec{/}\n`;

  if (upgrading) {
    factoryContent += `{#ffcc00-fg}⚙ UPGRADING...{/}`;
  } else {
    factoryContent += `{#00ff88-fg}● PRODUCING{/}`;
  }
  factoryBox.setContent(factoryContent);

  // Upgrade panel
  const nextLevel = state.metalFactory.level + 1;
  const upgradeCost = calculateUpgradeCost(state.metalFactory.level);
  const upgradeDuration = calculateUpgradeDuration(state.metalFactory.level);
  const nextProduction = calculateProduction(nextLevel);
  const canAfford = currentMetal >= upgradeCost;

  let upgradeContent: string;
  const upgradeProgress = getUpgradeProgress();

  if (upgradeProgress) {
    upgradeContent =
      `{bold}{#ffcc00-fg}⚙ UPGRADING TO LEVEL ${nextLevel}{/}\n\n` +
      `   ${progressBar(upgradeProgress.progress)}\n\n` +
      `   {#666666-fg}Time remaining:{/} {bold}{#00d4ff-fg}${formatTime(
        upgradeProgress.remaining
      )}{/}\n\n` +
      `   {#666666-fg}New production:{/} {#00ff88-fg}${nextProduction.toFixed(
        2
      )}/sec{/} ` +
      `{#666666-fg}(+${(nextProduction - production).toFixed(2)}){/}`;
  } else {
    const costColor = canAfford ? "#00ff88" : "#ff3366";
    upgradeContent =
      `{bold}Upgrade to Level ${nextLevel}{/}\n\n` +
      `   {#666666-fg}Cost:{/}        {${costColor}-fg}${formatNumber(
        upgradeCost
      )} metal{/}\n` +
      `   {#666666-fg}Duration:{/}    {#00d4ff-fg}${formatTime(
        upgradeDuration
      )}{/}\n` +
      `   {#666666-fg}Production:{/}  {#b8c4ce-fg}${production.toFixed(
        2
      )}{/} → {#00ff88-fg}${nextProduction.toFixed(2)}/sec{/}\n\n` +
      (canAfford
        ? `   {#00ff88-fg}Press [U] to upgrade{/}`
        : `   {#ff3366-fg}Need ${formatNumber(
            upgradeCost - currentMetal
          )} more metal{/}`);
  }
  upgradeBox.setContent(upgradeContent);

  // ═══════════════════════════════════════════════════════════════
  // FLEET TAB CONTENT
  // ═══════════════════════════════════════════════════════════════
  fleetHangar.setContent(
    `\n{#666666-fg}No ships constructed yet.\n\n` +
      `{#444444-fg}Build ships in the Shipyard below.{/}`
  );

  fleetMissions.setContent(
    `\n{#666666-fg}No active missions.\n\n` +
      `{#444444-fg}Send fleets to explore the galaxy.{/}`
  );

  fleetShipyard.setContent(
    `\n{#666666-fg}Shipyard not yet constructed.\n\n` +
      `{#444444-fg}Build a Shipyard on the Production tab to unlock ship construction.{/}`
  );

  // ═══════════════════════════════════════════════════════════════
  // CHAT TAB CONTENT
  // ═══════════════════════════════════════════════════════════════
  let chatContent = "";
  for (const msg of chatMessages) {
    chatContent += `{#666666-fg}[${msg.time}]{/} {${msg.color}-fg}${msg.user}:{/} ${msg.message}\n`;
  }
  chatMessages_box.setContent(chatContent);
  // Auto-scroll to bottom
  chatMessages_box.setScrollPerc(100);

  // ═══════════════════════════════════════════════════════════════
  // MAP TAB CONTENT
  // ═══════════════════════════════════════════════════════════════
  const mapWidth = (mapView.width as number) - 2 || 60;
  const mapHeight = (mapView.height as number) - 2 || 20;

  // Regenerate starfield if size changed
  if (
    starfield.length !== mapHeight ||
    (starfield[0] && starfield[0].length !== mapWidth)
  ) {
    starfield = generateStarfield(mapWidth, mapHeight);
  }

  let mapContent = "";
  let infoContent = "";

  if (currentZoom === "stars") {
    // ════════════════════════════════════════════════════════════
    // GALAXY VIEW - Show all star systems
    // ════════════════════════════════════════════════════════════
    mapView.setLabel(" {bold}🌌 GALAXY MAP{/bold} ");

    const mapBuffer: string[][] = starfield.map((row) => [...row]);

    // Place star systems
    starSystems.forEach((star, index) => {
      const sx = Math.floor((star.x / 100) * (mapWidth - 1));
      const sy = Math.floor((star.y / 100) * (mapHeight - 1));

      if (sy >= 0 && sy < mapHeight && sx >= 0 && sx < mapWidth) {
        const isSelected = index === selectedStarIndex;
        if (isSelected) {
          if (sx > 0) mapBuffer[sy][sx - 1] = `{#ffffff-fg}[{/}`;
          if (sx < mapWidth - 1) mapBuffer[sy][sx + 1] = `{#ffffff-fg}]{/}`;
        }
        mapBuffer[sy][sx] = `{${star.color}-fg}★{/}`;
      }
    });

    // Convert to string
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const char = mapBuffer[y][x];
        if (char === "." || char === "·") {
          mapContent += `{#222222-fg}${char}{/}`;
        } else if (char === "+" || char === "*") {
          mapContent += `{#333333-fg}${char}{/}`;
        } else {
          mapContent += char;
        }
      }
      if (y < mapHeight - 1) mapContent += "\n";
    }

    // Info panel for selected star
    const selectedStar = starSystems[selectedStarIndex];
    infoContent =
      `\n{bold}{${selectedStar.color}-fg}★ ${selectedStar.name}{/}\n\n` +
      `{#666666-fg}Type:{/} ${selectedStar.type} star\n\n` +
      `{#666666-fg}Planets:{/} ${selectedStar.planets.length}\n\n` +
      `{#00ff88-fg}Press + to enter{/}`;
  } else if (currentZoom === "system") {
    // ════════════════════════════════════════════════════════════
    // SOLAR SYSTEM VIEW - Show planets in current system
    // ════════════════════════════════════════════════════════════
    const currentSystem = starSystems[selectedStarIndex];
    mapView.setLabel(` {bold}🌌 ${currentSystem.name.toUpperCase()}{/bold} `);

    const mapBuffer: string[][] = starfield.map((row) => [...row]);
    const planets = getCurrentPlanets();

    // Draw the star at center
    const starX = Math.floor(mapWidth / 2);
    const starY = Math.floor(mapHeight / 2);
    mapBuffer[starY][starX] = `{${currentSystem.color}-fg}☀{/}`;

    // Place planets
    planets.forEach((planet, index) => {
      const px = Math.floor((planet.x / 100) * (mapWidth - 1));
      const py = Math.floor((planet.y / 100) * (mapHeight - 1));

      if (py >= 0 && py < mapHeight && px >= 0 && px < mapWidth) {
        const isSelected = index === selectedPlanetIndex;
        if (isSelected) {
          if (px > 0) mapBuffer[py][px - 1] = `{#ffffff-fg}[{/}`;
          if (px < mapWidth - 1) mapBuffer[py][px + 1] = `{#ffffff-fg}]{/}`;
        }
        mapBuffer[py][px] = `{${planet.color}-fg}${planet.symbol}{/}`;
      }
    });

    // Convert to string
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const char = mapBuffer[y][x];
        if (char === "." || char === "·") {
          mapContent += `{#333333-fg}${char}{/}`;
        } else if (char === "+" || char === "*") {
          mapContent += `{#555555-fg}${char}{/}`;
        } else {
          mapContent += char;
        }
      }
      if (y < mapHeight - 1) mapContent += "\n";
    }

    // Info panel for selected planet
    const selectedPlanet = planets[selectedPlanetIndex];
    infoContent =
      `\n{bold}{${selectedPlanet.color}-fg}${selectedPlanet.symbol} ${selectedPlanet.name}{/}\n\n` +
      `{#666666-fg}Size:{/} ${selectedPlanet.size}\n\n` +
      `{#666666-fg}Info:{/}\n` +
      `{#888888-fg}${selectedPlanet.info}{/}\n\n` +
      `{#00ff88-fg}+ zoom in{/} {#ff6b35-fg}- zoom out{/}`;
  } else if (currentZoom === "planet") {
    // ════════════════════════════════════════════════════════════
    // PLANET VIEW - Detailed view of selected planet
    // ════════════════════════════════════════════════════════════
    const planets = getCurrentPlanets();
    const planet = planets[selectedPlanetIndex];
    mapView.setLabel(` {bold}🌍 ${planet.name.toUpperCase()}{/bold} `);

    // ASCII art for planet based on size
    const planetArt: string[] = [];
    if (planet.size === "large") {
      planetArt.push(
        `           {${planet.color}-fg}░░░░░░░░░░░░{/}`,
        `       {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░{/}`,
        `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
        `   {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
        `  {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
        `  {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
        `  {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
        `   {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
        `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
        `       {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░{/}`,
        `           {${planet.color}-fg}░░░░░░░░░░░░{/}`
      );
    } else if (planet.size === "medium") {
      planetArt.push(
        `         {${planet.color}-fg}░░░░░░░░░░{/}`,
        `       {${planet.color}-fg}░░░░░░░░░░░░░░{/}`,
        `      {${planet.color}-fg}░░░░░░░░░░░░░░░░{/}`,
        `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░{/}`,
        `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░{/}`,
        `      {${planet.color}-fg}░░░░░░░░░░░░░░░░{/}`,
        `       {${planet.color}-fg}░░░░░░░░░░░░░░{/}`,
        `         {${planet.color}-fg}░░░░░░░░░░{/}`
      );
    } else {
      planetArt.push(
        `           {${planet.color}-fg}░░░░{/}`,
        `         {${planet.color}-fg}░░░░░░░░{/}`,
        `        {${planet.color}-fg}░░░░░░░░░░{/}`,
        `        {${planet.color}-fg}░░░░░░░░░░{/}`,
        `         {${planet.color}-fg}░░░░░░░░{/}`,
        `           {${planet.color}-fg}░░░░{/}`
      );
    }

    // Center the planet art
    const startY = Math.floor((mapHeight - planetArt.length) / 2);
    const lines: string[] = [];

    for (let y = 0; y < mapHeight; y++) {
      if (y >= startY && y < startY + planetArt.length) {
        lines.push(planetArt[y - startY]);
      } else {
        // Use the pre-generated starfield for stable background
        let line = "";
        for (let x = 0; x < mapWidth; x++) {
          const char = starfield[y]?.[x] || " ";
          if (char === "." || char === "·") {
            line += `{#222222-fg}${char}{/}`;
          } else if (char === "+" || char === "*") {
            line += `{#333333-fg}${char}{/}`;
          } else {
            line += " ";
          }
        }
        lines.push(line);
      }
    }

    mapContent = lines.join("\n");

    // Detailed info panel
    infoContent =
      `\n{bold}{${planet.color}-fg}${planet.symbol} ${planet.name}{/}\n\n` +
      `{#666666-fg}Classification:{/}\n` +
      `  ${planet.size} celestial body\n\n` +
      `{#666666-fg}Description:{/}\n` +
      `{#888888-fg}${planet.info}{/}\n\n` +
      `{#666666-fg}Status:{/}\n` +
      `  ${
        planet.symbol === "◎"
          ? "{#00ff88-fg}Colonized{/}"
          : "{#888888-fg}Unexplored{/}"
      }\n\n` +
      `{#ff6b35-fg}- zoom out{/}`;
  }

  mapView.setContent(mapContent);
  mapInfo.setContent(infoContent);

  // Update controls based on zoom level
  const zoomIndicator =
    currentZoom === "stars" ? "◉○○" : currentZoom === "system" ? "○◉○" : "○○◉";
  mapControls.setContent(
    `{#ffcc00-fg}Zoom:{/} ${zoomIndicator}\n` +
      `{#00ff88-fg}[+]{/} Zoom in\n` +
      `{#ff6b35-fg}[-]{/} Zoom out\n\n` +
      `{#00d4ff-fg}[Tab]{/} Next\n` +
      `{#00d4ff-fg}[←→↑↓]{/} Navigate`
  );

  // Log
  logBox.setContent(logMessage);

  screen.render();
};

// ═══════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════

// Tab selection
tabList.on("select", (item, index) => {
  switchTab(tabs[index].name);
});

// Global keys
// Open command palette
screen.key(["/"], () => {
  if (!commandModalOpen) {
    openCommandModal();
  }
});

screen.key(["escape", "q", "C-c"], () => {
  if (commandModalOpen) {
    closeCommandModal();
    return;
  }
  syncState(state);
  saveState(state);
  logMessage = "{#00ff88-fg}Game saved!{/}";
  render();
  setTimeout(() => process.exit(0), 200);
});

screen.key(["u", "U"], () => {
  if (commandModalOpen) return;
  if (currentTab === "production") {
    startUpgrade();
  }
});

screen.key(["s", "S"], () => {
  if (commandModalOpen) return;
  syncState(state);
  saveState(state);
  logMessage = "{#00ff88-fg}✓ Game saved!{/}";
});

// Number keys for quick tab switching
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

// Zoom controls
screen.key(["+", "="], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "stars") {
      // Zoom into selected star system
      currentZoom = "system";
      selectedPlanetIndex = 0;
      logMessage = `{#00d4ff-fg}Entering ${starSystems[selectedStarIndex].name}{/}`;
    } else if (currentZoom === "system") {
      currentZoom = "planet";
      logMessage = `{#00d4ff-fg}Viewing ${
        getCurrentPlanets()[selectedPlanetIndex].name
      }{/}`;
    }
  }
});

screen.key(["-", "_"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "planet") {
      currentZoom = "system";
      logMessage = `{#00d4ff-fg}Viewing ${starSystems[selectedStarIndex].name}{/}`;
    } else if (currentZoom === "system") {
      currentZoom = "stars";
      logMessage = "{#00d4ff-fg}Viewing galaxy map{/}";
    }
  }
});

// Tab key to cycle objects on map
screen.key(["tab"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "stars") {
      selectedStarIndex = (selectedStarIndex + 1) % starSystems.length;
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      selectedPlanetIndex = (selectedPlanetIndex + 1) % planets.length;
    }
  }
});

screen.key(["S-tab"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "stars") {
      selectedStarIndex =
        (selectedStarIndex - 1 + starSystems.length) % starSystems.length;
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      selectedPlanetIndex =
        (selectedPlanetIndex - 1 + planets.length) % planets.length;
    }
  }
});

// Arrow keys for map navigation
screen.key(["right"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "stars") {
      const current = starSystems[selectedStarIndex];
      let closest = -1;
      let closestDist = Infinity;
      starSystems.forEach((s, i) => {
        if (s.x > current.x) {
          const dist =
            Math.abs(s.x - current.x) + Math.abs(s.y - current.y) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedStarIndex = closest;
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      const current = planets[selectedPlanetIndex];
      let closest = -1;
      let closestDist = Infinity;
      planets.forEach((p, i) => {
        if (p.x > current.x) {
          const dist =
            Math.abs(p.x - current.x) + Math.abs(p.y - current.y) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedPlanetIndex = closest;
    }
  }
});

screen.key(["left"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "stars") {
      const current = starSystems[selectedStarIndex];
      let closest = -1;
      let closestDist = Infinity;
      starSystems.forEach((s, i) => {
        if (s.x < current.x) {
          const dist =
            Math.abs(s.x - current.x) + Math.abs(s.y - current.y) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedStarIndex = closest;
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      const current = planets[selectedPlanetIndex];
      let closest = -1;
      let closestDist = Infinity;
      planets.forEach((p, i) => {
        if (p.x < current.x) {
          const dist =
            Math.abs(p.x - current.x) + Math.abs(p.y - current.y) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedPlanetIndex = closest;
    }
  }
});

screen.key(["up"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "stars") {
      const current = starSystems[selectedStarIndex];
      let closest = -1;
      let closestDist = Infinity;
      starSystems.forEach((s, i) => {
        if (s.y < current.y) {
          const dist =
            Math.abs(s.y - current.y) + Math.abs(s.x - current.x) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedStarIndex = closest;
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      const current = planets[selectedPlanetIndex];
      let closest = -1;
      let closestDist = Infinity;
      planets.forEach((p, i) => {
        if (p.y < current.y) {
          const dist =
            Math.abs(p.y - current.y) + Math.abs(p.x - current.x) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedPlanetIndex = closest;
    }
  }
});

screen.key(["down"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "map") {
    if (currentZoom === "stars") {
      const current = starSystems[selectedStarIndex];
      let closest = -1;
      let closestDist = Infinity;
      starSystems.forEach((s, i) => {
        if (s.y > current.y) {
          const dist =
            Math.abs(s.y - current.y) + Math.abs(s.x - current.x) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedStarIndex = closest;
    } else if (currentZoom === "system") {
      const planets = getCurrentPlanets();
      const current = planets[selectedPlanetIndex];
      let closest = -1;
      let closestDist = Infinity;
      planets.forEach((p, i) => {
        if (p.y > current.y) {
          const dist =
            Math.abs(p.y - current.y) + Math.abs(p.x - current.x) * 0.5;
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
      });
      if (closest >= 0) selectedPlanetIndex = closest;
    }
  }
});

// Enter key to start typing in chat
screen.key(["enter"], () => {
  if (commandModalOpen || chatInputActive) return;
  if (currentTab === "chat") {
    openChatInput();
  }
});

// Focus handling
tabList.focus();

// ═══════════════════════════════════════════════════════════════
// GAME LOOP & AUTO-SAVE
// ═══════════════════════════════════════════════════════════════
setInterval(render, 100);

setInterval(() => {
  syncState(state);
  saveState(state);
}, 30000);

// Initial render
switchTab("overview");
render();
