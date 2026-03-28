import blessed from "blessed";
import { ChatMessage } from "../types";
import { getChatMessages, addChatMessage } from "../data/chat";
import { icons } from "../utils/icons";

const ROOM = "GENERAL";
const POLL_INTERVAL = 3000; // 3 seconds

export type ChatFocusElement = "messages" | "input" | null;

export const createChatPage = (
  parent: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  tabList: blessed.Widgets.ListElement,
  setLogMessage: (msg: string) => void
) => {
  const container = blessed.box({
    parent,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    hidden: true,
  });

  // Message Area
  const messagesBox = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%-5",
    label: ` {bold}${icons.chat} GENERAL CHAT{/bold} `,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#00d4ff" },
    },
    padding: { left: 1, right: 1 },
    scrollable: true,
    alwaysScroll: true,
    focusable: true,
    scrollbar: {
      style: {
        bg: "#1a4a6e",
      },
    },
  });

  // Input Area
  const inputBox = blessed.box({
    parent: container,
    bottom: 0,
    left: 0,
    width: "100%",
    height: 5,
    label: " {bold}MESSAGE{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#666666" },
    },
  });

  const input = blessed.textbox({
    parent: inputBox,
    top: 0,
    left: 1,
    width: "100%-4",
    height: 1,
    tags: true,
    style: {
      fg: "white",
      bg: "#1a1a2e",
    },
    inputOnFocus: true,
  });

  const inputHint = blessed.box({
    parent: inputBox,
    bottom: 0,
    left: 1,
    width: "100%-4",
    height: 1,
    tags: true,
    content:
      "{#666666-fg}Press Enter to send (empty to unfocus), Esc to cancel{/}",
    style: {
      fg: "#666666",
    },
  });

  let inputActive = false;
  let chatMessages: ChatMessage[] = [];
  let isVisible = false;
  let pollInterval: NodeJS.Timeout | null = null;
  let focusedElement: ChatFocusElement = null;

  // Load initial messages
  const loadMessages = async (forceScrollToBottom: boolean = false) => {
    try {
      const previousCount = chatMessages.length;
      chatMessages = await getChatMessages(ROOM);
      // Only scroll to bottom if:
      // - Forced (initial load, after sending message)
      // - New messages arrived AND user is not actively scrolling (messages not focused)
      const hasNewMessages = chatMessages.length > previousCount;
      const shouldScroll =
        forceScrollToBottom ||
        (hasNewMessages && focusedElement !== "messages");
      updateDisplay(shouldScroll);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  };

  // Update the display with current messages (optionally scroll to bottom)
  const updateDisplay = (scrollToBottom: boolean = false) => {
    let content = "";
    for (const msg of chatMessages) {
      content += `{#666666-fg}[${msg.time}]{/} {${msg.color}-fg}${msg.user}:{/} ${msg.message}\n`;
    }
    messagesBox.setContent(content);
    if (scrollToBottom) {
      messagesBox.setScrollPerc(100);
    }
    screen.render();
  };

  // Start polling for new messages
  const startPolling = () => {
    if (pollInterval) return; // Already polling

    pollInterval = setInterval(async () => {
      if (isVisible) {
        await loadMessages();
      }
    }, POLL_INTERVAL);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  // Update border colors based on focus state
  const updateBorderColors = () => {
    messagesBox.style.border.fg =
      focusedElement === "messages" ? "#00d4ff" : "#1a4a6e";
    inputBox.style.border.fg =
      focusedElement === "input" ? "#00d4ff" : "#1a4a6e";
  };

  // Focus the messages box
  const focusMessages = () => {
    focusedElement = "messages";
    inputActive = false;
    messagesBox.focus(); // Take focus from tabList
    updateBorderColors();
    screen.render();
  };

  // Focus the input box (and activate text input)
  const focusInput = () => {
    focusedElement = "input";
    inputActive = true;
    input.focus();
    input.setValue("");
    updateBorderColors();
    screen.render();
  };

  // Unfocus all elements (return to menu)
  const unfocus = () => {
    focusedElement = null;
    inputActive = false;
    updateBorderColors();
    tabList.focus();
    screen.render();
  };

  // Scroll the messages box
  const scrollMessages = (direction: "up" | "down") => {
    if (focusedElement === "messages") {
      messagesBox.scroll(direction === "up" ? -1 : 1);
      screen.render();
    }
  };

  const openInput = () => {
    focusInput();
  };

  const closeInput = () => {
    unfocus();
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) {
      // If empty, go back to messages view
      focusMessages();
      return;
    }

    try {
      await addChatMessage(ROOM, message.trim());
      setLogMessage("{#00ff88-fg}Message sent!{/}");
      // Reload messages to get the latest, scroll to see sent message
      await loadMessages(true);
    } catch (error) {
      console.error("Failed to send message:", error);
      setLogMessage("{#ff3366-fg}Failed to send message!{/}");
    }

    input.clearValue();
    input.focus();
    screen.render();
  };

  // Input handlers
  input.on("submit", (value: string) => {
    sendMessage(value);
  });

  input.on("cancel", () => {
    focusMessages();
  });

  input.key(["escape"], () => {
    focusMessages();
  });

  const render = () => {
    updateDisplay(false); // Don't scroll to bottom on every render tick
  };

  // Initialize messages on creation
  loadMessages(true);

  return {
    container,
    render,
    show: () => {
      isVisible = true;
      container.show();
      startPolling();
      // Load messages when showing, scroll to bottom
      loadMessages(true);
    },
    hide: () => {
      isVisible = false;
      focusedElement = null;
      inputActive = false;
      updateBorderColors();
      container.hide();
      stopPolling();
    },
    openInput,
    closeInput,
    focusMessages,
    focusInput,
    unfocus,
    scrollMessages,
    isInputActive: () => inputActive,
    getFocusedElement: () => focusedElement,
  };
};
