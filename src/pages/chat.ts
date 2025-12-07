import blessed from "blessed";
import { ChatMessage } from "../types";
import { getChatMessages, addChatMessage } from "../data/chat";
import { icons } from "../utils/icons";

const ROOM = "GENERAL";
const POLL_INTERVAL = 3000; // 3 seconds

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

  // Load initial messages
  const loadMessages = async () => {
    try {
      chatMessages = await getChatMessages(ROOM);
      updateDisplay();
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  };

  // Update the display with current messages
  const updateDisplay = () => {
    let content = "";
    for (const msg of chatMessages) {
      content += `{#666666-fg}[${msg.time}]{/} {${msg.color}-fg}${msg.user}:{/} ${msg.message}\n`;
    }
    messagesBox.setContent(content);
    messagesBox.setScrollPerc(100);
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

  const openInput = () => {
    inputActive = true;
    input.focus();
    input.setValue("");
    inputBox.style.border.fg = "#00d4ff";
    screen.render();
  };

  const closeInput = () => {
    inputActive = false;
    inputBox.style.border.fg = "#1a4a6e";
    tabList.focus();
    screen.render();
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) {
      // If empty, unfocus the input
      closeInput();
      return;
    }

    try {
      await addChatMessage(ROOM, message.trim());
      setLogMessage("{#00ff88-fg}Message sent!{/}");
      // Reload messages to get the latest
      await loadMessages();
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
    closeInput();
  });

  input.key(["escape"], () => {
    closeInput();
  });

  const render = () => {
    updateDisplay();
  };

  // Initialize messages on creation
  loadMessages();

  return {
    container,
    render,
    show: () => {
      isVisible = true;
      container.show();
      startPolling();
      // Load messages when showing
      loadMessages();
    },
    hide: () => {
      isVisible = false;
      container.hide();
      stopPolling();
    },
    openInput,
    closeInput,
    isInputActive: () => inputActive,
  };
};
