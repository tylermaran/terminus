// ═══════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════
export const formatNumber = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "M";
  if (n >= 1000) return (n / 1000).toFixed(2) + "K";
  return n.toFixed(1);
};

export const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const formatTimeAway = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

export const progressBar = (pct: number, width: number = 30): string => {
  const filled = Math.floor(pct * width);
  const empty = width - filled;
  return `{#00ff88-fg}${"█".repeat(filled)}{/}{#333333-fg}${"░".repeat(empty)}{/}`;
};

// ═══════════════════════════════════════════════════════════════
// STARFIELD GENERATION
// ═══════════════════════════════════════════════════════════════
export const generateStarfield = (width: number, height: number): string[][] => {
  const field: string[][] = [];
  for (let y = 0; y < height; y++) {
    field[y] = [];
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.03) {
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

export const twinkleStars = (starfield: string[][]): void => {
  for (let y = 0; y < starfield.length; y++) {
    for (let x = 0; x < (starfield[y]?.length || 0); x++) {
      const char = starfield[y][x];
      if (char !== " " && Math.random() < 0.05) {
        const r = Math.random();
        if (r < 0.4) starfield[y][x] = ".";
        else if (r < 0.7) starfield[y][x] = "·";
        else if (r < 0.9) starfield[y][x] = "+";
        else starfield[y][x] = "*";
      }
    }
  }
};


