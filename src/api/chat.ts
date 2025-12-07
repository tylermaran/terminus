import { ChatMessage } from "../types";
import { isServerMode, apiGetChatMessages, apiSendChatMessage } from "./client";
import * as dbChat from "../db/chat";
import { getUserId, getUsername, getUserColor } from "../config/user";

// ═══════════════════════════════════════════════════════════════
// CHAT ACCESS ABSTRACTION (DB or API)
// ═══════════════════════════════════════════════════════════════

export const getChatMessages = async (
  room: string = "GENERAL",
  limit?: number
): Promise<ChatMessage[]> => {
  if (isServerMode()) {
    try {
      return await apiGetChatMessages(room);
    } catch (error) {
      console.error("Failed to load chat messages from API:", error);
      return [];
    }
  } else {
    return await dbChat.getChatMessages(room, limit);
  }
};

export const addChatMessage = async (
  room: string,
  message: string
): Promise<ChatMessage> => {
  const userId = getUserId();
  const username = getUsername();
  const color = getUserColor();

  if (isServerMode()) {
    try {
      return await apiSendChatMessage(room, userId, username, color, message);
    } catch (error) {
      console.error("Failed to send chat message via API:", error);
      throw error;
    }
  } else {
    return await dbChat.addChatMessage(room, userId, username, color, message);
  }
};
