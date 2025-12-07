import blessed from "blessed";

export const createCommandModal = (screen: blessed.Widgets.Screen) => {
  const modal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 60,
    height: 10,
    label: " {bold}⌘ COMMAND{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      bg: "#0d0d18",
      border: { fg: "#00d4ff" },
      label: { fg: "#00d4ff" },
    },
    padding: { left: 1, right: 1 },
    hidden: true,
  });

  const input = blessed.textbox({
    parent: modal,
    top: 0,
    left: 0,
    width: "100%-4",
    height: 3,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      bg: "#1a1a2e",
      border: { fg: "#1a4a6e" },
      focus: {
        border: { fg: "#00d4ff" },
      },
    },
    inputOnFocus: true,
  });

  const hints = blessed.box({
    parent: modal,
    top: 4,
    left: 0,
    width: "100%-4",
    height: 3,
    tags: true,
    style: {
      fg: "#666666",
    },
  });

  hints.setContent(
    `{#666666-fg}Commands:{/} {#00ff88-fg}upgrade{/} {#00d4ff-fg}save{/} {#ff6b35-fg}reset{/} {#ff3366-fg}quit{/}\n` +
      `{#666666-fg}Tabs:{/} {#00d4ff-fg}overview{/} {#00d4ff-fg}production{/} {#00d4ff-fg}fleet{/} {#00d4ff-fg}chat{/} {#00d4ff-fg}map{/}`
  );

  return { modal, input, hints };
};

export type CommandModal = ReturnType<typeof createCommandModal>;


