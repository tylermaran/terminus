import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { GameState, ChatMessage } from "../src/types";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());

// Initialize Prisma client
// Set default DATABASE_URL for SQLite if not provided (for server, should be Postgres)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

// ═══════════════════════════════════════════════════════════════
// GAME STATE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/game-state?userId=xxx
app.get("/api/game-state", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res
        .status(400)
        .json({ error: "userId query parameter is required" });
    }

    const dbState = await prisma.gameState.findUnique({
      where: { userId },
    });

    if (!dbState) {
      // Return default state if none exists
      const defaultState: GameState = {
        metal: 100,
        metalFactory: {
          level: 1,
          upgradeStartTime: null,
          upgradeDuration: 0,
        },
        lastUpdate: Date.now(),
      };
      return res.json(defaultState);
    }

    const gameState: GameState = {
      metal: dbState.metal,
      metalFactory: {
        level: dbState.metalFactoryLevel,
        upgradeStartTime:
          dbState.metalFactoryUpgradeStartTime !== null
            ? Number(dbState.metalFactoryUpgradeStartTime)
            : null,
        upgradeDuration: Number(dbState.metalFactoryUpgradeDuration),
      },
      lastUpdate: Number(dbState.lastUpdate),
    };

    res.json(gameState);
  } catch (error) {
    console.error("Error getting game state:", error);
    res.status(500).json({ error: "Failed to get game state" });
  }
});

// POST /api/game-state?userId=xxx
app.post("/api/game-state", async (req, res) => {
  try {
    const { userId } = req.query;
    const { username, color } = req.body;

    if (!userId || typeof userId !== "string") {
      return res
        .status(400)
        .json({ error: "userId query parameter is required" });
    }

    const gameState: GameState = req.body;

    // Ensure lastUpdate is set
    gameState.lastUpdate = Date.now();

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username: username || `User_${userId.substring(0, 8)}`,
        color: color || "#00ff88",
      },
      update: {
        ...(username && { username }),
        ...(color && { color }),
      },
    });

    await prisma.gameState.upsert({
      where: { userId },
      create: {
        userId,
        metal: gameState.metal,
        metalFactoryLevel: gameState.metalFactory.level,
        metalFactoryUpgradeStartTime:
          gameState.metalFactory.upgradeStartTime !== null
            ? BigInt(gameState.metalFactory.upgradeStartTime)
            : null,
        metalFactoryUpgradeDuration: BigInt(
          gameState.metalFactory.upgradeDuration
        ),
        lastUpdate: BigInt(gameState.lastUpdate),
      },
      update: {
        metal: gameState.metal,
        metalFactoryLevel: gameState.metalFactory.level,
        metalFactoryUpgradeStartTime:
          gameState.metalFactory.upgradeStartTime !== null
            ? BigInt(gameState.metalFactory.upgradeStartTime)
            : null,
        metalFactoryUpgradeDuration: BigInt(
          gameState.metalFactory.upgradeDuration
        ),
        lastUpdate: BigInt(gameState.lastUpdate),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving game state:", error);
    res.status(500).json({ error: "Failed to save game state" });
  }
});

// ═══════════════════════════════════════════════════════════════
// CHAT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/chat/:room
app.get("/api/chat/:room", async (req, res) => {
  try {
    const { room } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const messages = await prisma.chatMessage.findMany({
      where: { room },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      user: msg.username,
      color: msg.color,
      message: msg.message,
      time: formatTime(msg.createdAt),
    }));

    res.json(chatMessages);
  } catch (error) {
    console.error("Error getting chat messages:", error);
    res.status(500).json({ error: "Failed to get chat messages" });
  }
});

// POST /api/chat/:room
app.post("/api/chat/:room", async (req, res) => {
  try {
    const { room } = req.params;
    const { userId, username, color, message } = req.body;

    if (!userId || !username || !message) {
      return res
        .status(400)
        .json({ error: "userId, username, and message are required" });
    }

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username,
        color: color || "#00ff88",
      },
      update: {
        username,
        ...(color && { color }),
      },
    });

    const dbMessage = await prisma.chatMessage.create({
      data: {
        room,
        userId,
        username,
        color: color || "#00ff88",
        message,
      },
    });

    const chatMessage: ChatMessage = {
      user: dbMessage.username,
      color: dbMessage.color,
      message: dbMessage.message,
      time: formatTime(dbMessage.createdAt),
    };

    res.json(chatMessage);
  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({ error: "Failed to send chat message" });
  }
});

// Helper to format time for display
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
