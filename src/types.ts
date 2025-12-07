import blessed from "blessed";
import contrib from "blessed-contrib";

// ═══════════════════════════════════════════════════════════════
// GAME STATE TYPES
// ═══════════════════════════════════════════════════════════════
export interface GameState {
  metal: number;
  metalFactory: {
    level: number;
    upgradeStartTime: number | null;
    upgradeDuration: number;
  };
  lastUpdate: number;
}

// ═══════════════════════════════════════════════════════════════
// MAP/PLANET TYPES
// ═══════════════════════════════════════════════════════════════
export interface Planet {
  name: string;
  symbol: string;
  color: string;
  x: number;
  y: number;
  size: "small" | "medium" | "large";
  info: string;
}

export interface StarSystem {
  name: string;
  color: string;
  x: number;
  y: number;
  type: "yellow" | "red" | "blue" | "white" | "orange";
  planets: Planet[];
}

export type ZoomLevel = "stars" | "system" | "planet";

// ═══════════════════════════════════════════════════════════════
// CHAT TYPES
// ═══════════════════════════════════════════════════════════════
export interface ChatMessage {
  user: string;
  color: string;
  message: string;
  time: string;
}

// ═══════════════════════════════════════════════════════════════
// UI TYPES
// ═══════════════════════════════════════════════════════════════
export type TabName = "overview" | "production" | "fleet" | "chat" | "map";

export interface Tab {
  name: TabName;
  label: string;
  icon: string;
}

// Screen context passed to pages
export interface ScreenContext {
  screen: blessed.Widgets.Screen;
  mainContent: blessed.Widgets.BoxElement;
}

// Page interface - each page implements this
export interface Page {
  container: blessed.Widgets.BoxElement;
  render: () => void;
  show: () => void;
  hide: () => void;
}


