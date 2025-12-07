const blessed = require("blessed");
const contrib = require("blessed-contrib");

// Demo Data
const gameData = {
  empire: {
    name: "Stellar Dominion",
    rank: 42,
    points: 158420,
  },
  planets: [
    {
      id: 1,
      name: "Terra Prime",
      coords: "[1:42:7]",
      temp: "24°C",
      fields: "163/188",
      selected: true,
    },
    {
      id: 2,
      name: "Frost Haven",
      coords: "[1:42:9]",
      temp: "-48°C",
      fields: "142/156",
      selected: false,
    },
    {
      id: 3,
      name: "Vulcan IV",
      coords: "[2:118:4]",
      temp: "186°C",
      fields: "201/220",
      selected: false,
    },
    {
      id: 4,
      name: "Nebula Station",
      coords: "[3:87:12]",
      temp: "-12°C",
      fields: "89/120",
      selected: false,
    },
  ],
  resources: {
    metal: { current: 2847291, production: 48520, storage: 5000000 },
    crystal: { current: 1523847, production: 24180, storage: 2500000 },
    deuterium: { current: 847291, production: 12840, storage: 1000000 },
    energy: { current: 892, total: 1250 },
    darkMatter: 42850,
  },
  fleet: [
    { name: "Light Fighter", count: 2847, attack: 50, shield: 10, hull: 400 },
    { name: "Heavy Fighter", count: 892, attack: 150, shield: 25, hull: 1000 },
    { name: "Cruiser", count: 421, attack: 400, shield: 50, hull: 2700 },
    { name: "Battleship", count: 187, attack: 1000, shield: 200, hull: 6000 },
    { name: "Battlecruiser", count: 89, attack: 700, shield: 400, hull: 7000 },
    { name: "Bomber", count: 156, attack: 1000, shield: 500, hull: 7500 },
    { name: "Destroyer", count: 42, attack: 2000, shield: 500, hull: 11000 },
    {
      name: "Deathstar",
      count: 3,
      attack: 200000,
      shield: 50000,
      hull: 900000,
    },
    { name: "Small Cargo", count: 1842, attack: 5, shield: 10, hull: 400 },
    { name: "Large Cargo", count: 647, attack: 5, shield: 25, hull: 1200 },
    { name: "Colony Ship", count: 2, attack: 50, shield: 100, hull: 3000 },
    { name: "Recycler", count: 284, attack: 1, shield: 10, hull: 1600 },
    { name: "Espionage Probe", count: 4821, attack: 0, shield: 0, hull: 100 },
  ],
  research: [
    { name: "Energy Tech", level: 14, category: "basic" },
    { name: "Laser Tech", level: 12, category: "basic" },
    { name: "Ion Tech", level: 8, category: "basic" },
    { name: "Hyperspace Tech", level: 9, category: "propulsion" },
    { name: "Plasma Tech", level: 7, category: "basic" },
    { name: "Combustion Drive", level: 15, category: "propulsion" },
    { name: "Impulse Drive", level: 11, category: "propulsion" },
    { name: "Hyperspace Drive", level: 8, category: "propulsion" },
    { name: "Espionage Tech", level: 10, category: "advanced" },
    { name: "Computer Tech", level: 14, category: "advanced" },
    { name: "Astrophysics", level: 12, category: "advanced" },
    { name: "Weapons Tech", level: 13, category: "military" },
    { name: "Shielding Tech", level: 12, category: "military" },
    { name: "Armor Tech", level: 13, category: "military" },
    { name: "Graviton Tech", level: 1, category: "advanced" },
  ],
  missions: [
    {
      type: "Attack",
      fleet: "423 ships",
      target: "[2:84:6]",
      arrival: "00:42:18",
      status: "outbound",
    },
    {
      type: "Transport",
      fleet: "12 ships",
      target: "[1:42:9]",
      arrival: "00:08:42",
      status: "outbound",
    },
    {
      type: "Espionage",
      fleet: "5 probes",
      target: "[3:112:8]",
      arrival: "00:02:14",
      status: "outbound",
    },
    {
      type: "Return",
      fleet: "847 ships",
      target: "Terra Prime",
      arrival: "01:24:08",
      status: "returning",
    },
  ],
  buildQueue: [
    { name: "Metal Mine", level: 28, time: "00:48:21" },
    { name: "Solar Plant", level: 24, time: "01:12:45" },
  ],
  messages: [
    { time: "14:28", text: "Espionage report from [2:84:6] received" },
    { time: "14:15", text: "Fleet arrived at Frost Haven" },
    { time: "13:42", text: "Research complete: Computer Tech Level 14" },
    { time: "12:18", text: "Combat report: Victory at [4:22:8]" },
    { time: "11:55", text: "New colony established at [3:87:12]" },
  ],
  resourceHistory: {
    metal: [1800000, 1950000, 2100000, 2280000, 2450000, 2620000, 2847291],
    crystal: [980000, 1080000, 1180000, 1290000, 1380000, 1450000, 1523847],
    deuterium: [520000, 580000, 640000, 710000, 760000, 810000, 847291],
  },
};

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: "★ STELLAR CONQUEST ★",
  cursor: {
    artificial: true,
    shape: "line",
    blink: true,
    color: null,
  },
});

// Color scheme - cyberpunk/space theme
const colors = {
  bg: "#0a0a12",
  border: "#1a4a6e",
  highlight: "#00d4ff",
  accent: "#ff6b35",
  success: "#00ff88",
  warning: "#ffcc00",
  danger: "#ff3366",
  metal: "#b8c4ce",
  crystal: "#00ccff",
  deuterium: "#00ff99",
  energy: "#ffdd00",
};

// Grid layout
const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

// ═══════════════════════════════════════════════════════════════
// HEADER - Empire Info
// ═══════════════════════════════════════════════════════════════
const header = grid.set(0, 0, 1, 12, blessed.box, {
  content: `{bold}{#00d4ff-fg}★ STELLAR CONQUEST ★{/}  │  {#ff6b35-fg}${
    gameData.empire.name
  }{/}  │  Rank: {#00ff88-fg}#${
    gameData.empire.rank
  }{/}  │  Points: {#ffcc00-fg}${gameData.empire.points.toLocaleString()}{/}  │  Dark Matter: {#cc66ff-fg}${gameData.resources.darkMatter.toLocaleString()}{/}`,
  tags: true,
  style: {
    fg: "white",
    bg: "#0d0d18",
    border: { fg: "#1a4a6e" },
  },
});

// ═══════════════════════════════════════════════════════════════
// PLANETS LIST (Left sidebar)
// ═══════════════════════════════════════════════════════════════
const planetsBox = grid.set(1, 0, 5, 3, blessed.box, {
  label: " {bold}⬡ PLANETS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
  padding: { left: 1, right: 1 },
});

let planetsContent = "";
gameData.planets.forEach((planet, i) => {
  const selector = planet.selected ? "{#00d4ff-fg}▶{/}" : " ";
  const nameColor = planet.selected ? "#00d4ff" : "#888888";
  planetsContent += `${selector} {${nameColor}-fg}${planet.name}{/}\n`;
  planetsContent += `   {#666666-fg}${planet.coords}{/}\n`;
  planetsContent += `   {#444444-fg}${planet.fields} │ ${planet.temp}{/}\n`;
  if (i < gameData.planets.length - 1) planetsContent += "\n";
});
planetsBox.setContent(planetsContent);

// ═══════════════════════════════════════════════════════════════
// RESOURCES DISPLAY
// ═══════════════════════════════════════════════════════════════
const resourcesBox = grid.set(1, 3, 2, 6, blessed.box, {
  label: " {bold}◈ RESOURCES{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
  padding: { left: 1, right: 1 },
});

const formatNumber = (n) => n.toLocaleString();
const resourceBar = (current, max, color) => {
  const pct = Math.floor((current / max) * 20);
  const filled = "█".repeat(pct);
  const empty = "░".repeat(20 - pct);
  return `{${color}-fg}${filled}{/}{#333333-fg}${empty}{/}`;
};

const res = gameData.resources;
const resourcesContent =
  `{#b8c4ce-fg}⛏  METAL{/}     ${formatNumber(res.metal.current).padStart(
    12
  )} {#666666-fg}(+${formatNumber(res.metal.production)}/h){/}\n` +
  `   ${resourceBar(res.metal.current, res.metal.storage, "#b8c4ce")}\n` +
  `{#00ccff-fg}💎 CRYSTAL{/}   ${formatNumber(res.crystal.current).padStart(
    12
  )} {#666666-fg}(+${formatNumber(res.crystal.production)}/h){/}\n` +
  `   ${resourceBar(res.crystal.current, res.crystal.storage, "#00ccff")}\n` +
  `{#00ff99-fg}⚗  DEUTERIUM{/} ${formatNumber(res.deuterium.current).padStart(
    12
  )} {#666666-fg}(+${formatNumber(res.deuterium.production)}/h){/}\n` +
  `   ${resourceBar(
    res.deuterium.current,
    res.deuterium.storage,
    "#00ff99"
  )}\n` +
  `{#ffdd00-fg}⚡ ENERGY{/}    ${res.energy.current
    .toString()
    .padStart(12)} {#666666-fg}/ ${res.energy.total}{/}`;

resourcesBox.setContent(resourcesContent);

// ═══════════════════════════════════════════════════════════════
// ACTIVE MISSIONS
// ═══════════════════════════════════════════════════════════════
const missionsBox = grid.set(1, 9, 2, 3, blessed.box, {
  label: " {bold}🚀 MISSIONS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#ff6b35" },
  },
  padding: { left: 1, right: 1 },
});

let missionsContent = "";
gameData.missions.forEach((m, i) => {
  const typeColor =
    m.type === "Attack"
      ? "#ff3366"
      : m.type === "Return"
      ? "#00ff88"
      : m.type === "Espionage"
      ? "#cc66ff"
      : "#00d4ff";
  const statusIcon = m.status === "outbound" ? "→" : "←";
  missionsContent += `{${typeColor}-fg}${m.type.padEnd(10)}{/} {#ffcc00-fg}${
    m.arrival
  }{/}\n`;
  missionsContent += `{#666666-fg}${statusIcon} ${m.target}{/}\n`;
  if (i < gameData.missions.length - 1) missionsContent += "\n";
});
missionsBox.setContent(missionsContent);

// ═══════════════════════════════════════════════════════════════
// RESOURCE CHART
// ═══════════════════════════════════════════════════════════════
const resourceChart = grid.set(3, 3, 3, 6, contrib.line, {
  label: " {bold}📈 RESOURCE TREND{/bold} ",
  tags: true,
  style: {
    line: "#00d4ff",
    text: "#888888",
    baseline: "#333333",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
  showLegend: true,
  legend: { width: 12 },
});

const chartData = [
  {
    title: "Metal",
    x: ["6h", "5h", "4h", "3h", "2h", "1h", "Now"],
    y: gameData.resourceHistory.metal.map((v) => v / 1000000),
    style: { line: "#b8c4ce" },
  },
  {
    title: "Crystal",
    x: ["6h", "5h", "4h", "3h", "2h", "1h", "Now"],
    y: gameData.resourceHistory.crystal.map((v) => v / 1000000),
    style: { line: "#00ccff" },
  },
  {
    title: "Deut",
    x: ["6h", "5h", "4h", "3h", "2h", "1h", "Now"],
    y: gameData.resourceHistory.deuterium.map((v) => v / 1000000),
    style: { line: "#00ff99" },
  },
];
resourceChart.setData(chartData);

// ═══════════════════════════════════════════════════════════════
// BUILD QUEUE
// ═══════════════════════════════════════════════════════════════
const buildBox = grid.set(3, 9, 3, 3, blessed.box, {
  label: " {bold}🔨 BUILD QUEUE{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#ffcc00" },
  },
  padding: { left: 1, right: 1 },
});

let buildContent = "";
gameData.buildQueue.forEach((item, i) => {
  buildContent += `{#00d4ff-fg}${item.name}{/}\n`;
  buildContent += `  Level {#00ff88-fg}${item.level}{/}\n`;
  buildContent += `  {#ffcc00-fg}⏱ ${item.time}{/}\n`;
  if (i < gameData.buildQueue.length - 1) buildContent += "\n";
});
buildBox.setContent(buildContent);

// ═══════════════════════════════════════════════════════════════
// FLEET TABLE
// ═══════════════════════════════════════════════════════════════
const fleetTable = grid.set(6, 0, 4, 6, contrib.table, {
  label: " {bold}🛸 FLEET OVERVIEW{/bold} ",
  tags: true,
  columnSpacing: 2,
  columnWidth: [16, 8, 8, 7, 8],
  fg: "white",
  selectedFg: "black",
  selectedBg: "#00d4ff",
  style: {
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
    header: { fg: "#00d4ff", bold: true },
  },
});

fleetTable.setData({
  headers: ["Ship", "Count", "Attack", "Shield", "Hull"],
  data: gameData.fleet.map((ship) => [
    ship.name,
    ship.count.toLocaleString(),
    ship.attack.toLocaleString(),
    ship.shield.toLocaleString(),
    ship.hull.toLocaleString(),
  ]),
});

// ═══════════════════════════════════════════════════════════════
// RESEARCH TABLE
// ═══════════════════════════════════════════════════════════════
const researchTable = grid.set(6, 6, 4, 6, contrib.table, {
  label: " {bold}🔬 RESEARCH{/bold} ",
  tags: true,
  columnSpacing: 2,
  columnWidth: [18, 8, 12],
  fg: "white",
  selectedFg: "black",
  selectedBg: "#00d4ff",
  style: {
    border: { fg: "#1a4a6e" },
    label: { fg: "#cc66ff" },
    header: { fg: "#cc66ff", bold: true },
  },
});

const categoryColors = {
  basic: "#00d4ff",
  propulsion: "#00ff88",
  advanced: "#cc66ff",
  military: "#ff6b35",
};

researchTable.setData({
  headers: ["Technology", "Level", "Category"],
  data: gameData.research.map((tech) => [
    tech.name,
    `Lvl ${tech.level}`,
    tech.category.toUpperCase(),
  ]),
});

// ═══════════════════════════════════════════════════════════════
// MESSAGE LOG
// ═══════════════════════════════════════════════════════════════
const messagesBox = grid.set(10, 0, 2, 8, blessed.box, {
  label: " {bold}📨 MESSAGE LOG{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "white",
    border: { fg: "#1a4a6e" },
    label: { fg: "#00d4ff" },
  },
  padding: { left: 1, right: 1 },
  scrollable: true,
});

let messagesContent = "";
gameData.messages.forEach((msg) => {
  messagesContent += `{#666666-fg}[${msg.time}]{/} ${msg.text}\n`;
});
messagesBox.setContent(messagesContent);

// ═══════════════════════════════════════════════════════════════
// CONTROLS / HELP
// ═══════════════════════════════════════════════════════════════
const controlsBox = grid.set(10, 8, 2, 4, blessed.box, {
  label: " {bold}⌨ CONTROLS{/bold} ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "#666666",
    border: { fg: "#1a4a6e" },
    label: { fg: "#666666" },
  },
  padding: { left: 1, right: 1 },
});

controlsBox.setContent(
  `{#00d4ff-fg}[P]{/} Planets   {#00d4ff-fg}[F]{/} Fleet\n` +
    `{#00d4ff-fg}[R]{/} Research  {#00d4ff-fg}[B]{/} Build\n` +
    `{#00d4ff-fg}[G]{/} Galaxy    {#ff3366-fg}[Q]{/} Quit`
);

// ═══════════════════════════════════════════════════════════════
// ASCII ART DECORATION
// ═══════════════════════════════════════════════════════════════

// Add some animated elements
let tick = 0;
const animate = () => {
  tick++;

  // Update mission timers (simple countdown simulation)
  if (tick % 10 === 0) {
    let updatedMissions = "";
    gameData.missions.forEach((m, i) => {
      const typeColor =
        m.type === "Attack"
          ? "#ff3366"
          : m.type === "Return"
          ? "#00ff88"
          : m.type === "Espionage"
          ? "#cc66ff"
          : "#00d4ff";
      const statusIcon = m.status === "outbound" ? "→" : "←";
      // Simple animation - flash the timer
      const timerColor = tick % 20 < 10 ? "#ffcc00" : "#ff6b35";
      updatedMissions += `{${typeColor}-fg}${m.type.padEnd(
        10
      )}{/} {${timerColor}-fg}${m.arrival}{/}\n`;
      updatedMissions += `{#666666-fg}${statusIcon} ${m.target}{/}\n`;
      if (i < gameData.missions.length - 1) updatedMissions += "\n";
    });
    missionsBox.setContent(updatedMissions);
  }

  screen.render();
};

// Start animation loop
setInterval(animate, 100);

// Key bindings
screen.key(["escape", "q", "C-c"], () => {
  return process.exit(0);
});

screen.key(["p"], () => {
  // Cycle through planets
  const currentIdx = gameData.planets.findIndex((p) => p.selected);
  gameData.planets[currentIdx].selected = false;
  const nextIdx = (currentIdx + 1) % gameData.planets.length;
  gameData.planets[nextIdx].selected = true;

  let content = "";
  gameData.planets.forEach((planet, i) => {
    const selector = planet.selected ? "{#00d4ff-fg}▶{/}" : " ";
    const nameColor = planet.selected ? "#00d4ff" : "#888888";
    content += `${selector} {${nameColor}-fg}${planet.name}{/}\n`;
    content += `   {#666666-fg}${planet.coords}{/}\n`;
    content += `   {#444444-fg}${planet.fields} │ ${planet.temp}{/}\n`;
    if (i < gameData.planets.length - 1) content += "\n";
  });
  planetsBox.setContent(content);
  screen.render();
});

// Focus handling for scrolling
screen.key(["tab"], () => {
  // Could implement focus cycling here
});

// Initial render
screen.render();
