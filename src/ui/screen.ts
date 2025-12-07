import blessed from "blessed";
import { Tab, TabName } from "../types";
import { icons } from "../utils/icons";

// ═══════════════════════════════════════════════════════════════
// TABS CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export const tabs: Tab[] = [
  { name: "overview", label: "Overview", icon: icons.overview },
  { name: "production", label: "Production", icon: icons.production },
  { name: "fleet", label: "Fleet", icon: icons.fleet },
  { name: "chat", label: "Chat", icon: icons.chat },
  { name: "map", label: "Map", icon: icons.map },
];

// ═══════════════════════════════════════════════════════════════
// SCREEN SETUP
// ═══════════════════════════════════════════════════════════════
export const createScreen = () => {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Adventure",
  });

  // Resource bar
  const resourceBar = blessed.box({
    parent: screen,
    top: 0,
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
    top: 3,
    left: 0,
    width: 20,
    height: "100%-14",
    label: " {bold}MENU{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#00d4ff" },
    },
  });

  // Tab list
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
    items: tabs.map(
      (t, i) => `  ${t.icon} ${t.label} {#666666-fg}[${i + 1}]{/}`
    ),
  });

  // Controls box
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
    top: 3,
    left: 20,
    width: "100%-20",
    height: "100%-5",
    tags: true,
  });

  // Log bar
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

  return {
    screen,
    resourceBar,
    sidebar,
    tabList,
    controlsBox,
    mainContent,
    logBox,
  };
};

export type ScreenComponents = ReturnType<typeof createScreen>;
