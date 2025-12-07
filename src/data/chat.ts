import { ChatMessage } from "../types";
import * as apiChat from "../api/chat";

// ═══════════════════════════════════════════════════════════════
// CHAT MESSAGE ACCESS (using DB/API abstraction)
// ═══════════════════════════════════════════════════════════════

// Re-export async functions from api/chat
export const getChatMessages = apiChat.getChatMessages;
export const addChatMessage = (
  room: string,
  message: string
): Promise<ChatMessage> => {
  return apiChat.addChatMessage(room, message);
};
