import { GameState, ChatMessage } from "../types";

// ═══════════════════════════════════════════════════════════════
// REST API CLIENT
// ═══════════════════════════════════════════════════════════════

const API_SERVER_URL = process.env.API_SERVER_URL;

// Check if we're in server mode
export const isServerMode = (): boolean => {
  return !!API_SERVER_URL;
};

// Get the API server URL
export const getApiServerUrl = (): string => {
  if (!API_SERVER_URL) {
    throw new Error("API_SERVER_URL is not set");
  }
  return API_SERVER_URL.replace(/\/$/, ""); // Remove trailing slash
};

// Helper to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${getApiServerUrl()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
};

// Game State API calls
export const apiGetGameState = async (userId: string): Promise<GameState> => {
  return apiRequest<GameState>(
    `/api/game-state?userId=${encodeURIComponent(userId)}`
  );
};

export const apiSaveGameState = async (
  userId: string,
  state: GameState,
  username?: string,
  color?: string
): Promise<void> => {
  await apiRequest<void>(
    `/api/game-state?userId=${encodeURIComponent(userId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        ...state,
        username,
        color,
      }),
    }
  );
};

// Chat API calls
export const apiGetChatMessages = async (
  room: string = "GENERAL"
): Promise<ChatMessage[]> => {
  return apiRequest<ChatMessage[]>(`/api/chat/${encodeURIComponent(room)}`);
};

export const apiSendChatMessage = async (
  room: string,
  userId: string,
  username: string,
  color: string,
  message: string
): Promise<ChatMessage> => {
  return apiRequest<ChatMessage>(`/api/chat/${encodeURIComponent(room)}`, {
    method: "POST",
    body: JSON.stringify({
      userId,
      username,
      color,
      message,
    }),
  });
};
