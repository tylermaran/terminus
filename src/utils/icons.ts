// ═══════════════════════════════════════════════════════════════
// ICON UTILITIES
// ═══════════════════════════════════════════════════════════════

// Icon definitions using ASCII/Unicode characters for maximum terminal compatibility
export const icons = {
  production: "⛏️",
  planets: "◉",
  fleet: "◊",
  research: "◆",
  chat: "⌲",
  map: "☽",
  overview: "◈",
  upgrade: "▲",
  metal: "◈",
  factory: "▦",
  producing: "●",
} as const;

// Export a function to get icons (useful if we want to change mode at runtime)
export const getIcon = (name: keyof typeof icons): string => {
  return icons[name];
};
