import fs from "fs";
import path from "path";
import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════
// USER CONFIGURATION
// ═══════════════════════════════════════════════════════════════

interface UserConfig {
  userId: string;
  username: string;
  color: string;
}

const CONFIG_DIR = path.join(process.cwd(), ".adventure");
const CONFIG_FILE = path.join(CONFIG_DIR, "user.json");

const DEFAULT_COLORS = [
  "#00ff88",
  "#00d4ff",
  "#ff6b35",
  "#cc66ff",
  "#ffcc00",
  "#ff3366",
];

// Generate a random color from the default palette
const generateColor = (): string => {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
};

// Generate a default username based on userId
const generateUsername = (userId: string): string => {
  const prefix = "Player_";
  const shortId = userId.substring(0, 8);
  return `${prefix}${shortId}`;
};

// Load or create user configuration
export const getUserConfig = (): UserConfig => {
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Try to load existing config
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      const config = JSON.parse(data) as UserConfig;

      // Validate config structure
      if (config.userId && config.username && config.color) {
        return config;
      }
    }

    // Create new config
    const userId = crypto.randomUUID();
    const username = process.env.USERNAME || generateUsername(userId);
    const color = generateColor();

    const newConfig: UserConfig = {
      userId,
      username,
      color,
    };

    // Save config
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));

    return newConfig;
  } catch (error) {
    console.error("Failed to load/create user config:", error);

    // Fallback to environment or defaults
    const userId = process.env.USER_ID || crypto.randomUUID();
    const username = process.env.USERNAME || generateUsername(userId);
    const color = generateColor();

    return { userId, username, color };
  }
};

// Get current user ID
export const getUserId = (): string => {
  return getUserConfig().userId;
};

// Get current username
export const getUsername = (): string => {
  return getUserConfig().username;
};

// Get current user color
export const getUserColor = (): string => {
  return getUserConfig().color;
};

// Update username
export const updateUsername = (username: string): void => {
  try {
    const config = getUserConfig();
    config.username = username;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Failed to update username:", error);
  }
};

// Update color
export const updateColor = (color: string): void => {
  try {
    const config = getUserConfig();
    config.color = color;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Failed to update color:", error);
  }
};
