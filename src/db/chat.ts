import { prisma } from "./client";
import { ChatMessage } from "../types";

// ═══════════════════════════════════════════════════════════════
// CHAT MESSAGE DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

export const getChatMessages = async (
  room: string = "GENERAL",
  limit: number = 100
): Promise<ChatMessage[]> => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { room },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return messages.map((msg) => ({
      user: msg.username,
      color: msg.color,
      message: msg.message,
      time: formatTime(msg.createdAt),
    }));
  } catch (error) {
    console.error("Failed to load chat messages from database:", error);
    return [];
  }
};

export const addChatMessage = async (
  room: string,
  userId: string,
  username: string,
  color: string,
  message: string
): Promise<ChatMessage> => {
  try {
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username,
        color,
      },
      update: {
        username,
        color,
      },
    });

    const dbMessage = await prisma.chatMessage.create({
      data: {
        room,
        userId,
        username,
        color,
        message,
      },
    });

    return {
      user: dbMessage.username,
      color: dbMessage.color,
      message: dbMessage.message,
      time: formatTime(dbMessage.createdAt),
    };
  } catch (error) {
    console.error("Failed to add chat message to database:", error);
    throw error;
  }
};

// Helper to format time for display
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
