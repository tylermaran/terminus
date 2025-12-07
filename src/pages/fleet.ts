import blessed from "blessed";

export const createFleetPage = (parent: blessed.Widgets.BoxElement) => {
  const container = blessed.box({
    parent,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    hidden: true,
  });

  // Ship Hangar
  const hangarBox = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: "50%",
    height: "60%",
    label: " {bold}🛸 SHIP HANGAR{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#ff6b35" },
    },
    padding: { left: 1, right: 1 },
  });

  // Active Missions
  const missionsBox = blessed.box({
    parent: container,
    top: 0,
    left: "50%",
    width: "50%",
    height: "60%",
    label: " {bold}📡 ACTIVE MISSIONS{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#00d4ff" },
    },
    padding: { left: 1, right: 1 },
  });

  // Shipyard
  const shipyardBox = blessed.box({
    parent: container,
    top: "60%",
    left: 0,
    width: "100%",
    height: "40%",
    label: " {bold}🔧 SHIPYARD{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#00ff88" },
    },
    padding: { left: 1, right: 1 },
  });

  const render = () => {
    hangarBox.setContent(
      `\n{#666666-fg}No ships constructed yet.\n\n` +
        `{#444444-fg}Build ships in the Shipyard below.{/}`
    );

    missionsBox.setContent(
      `\n{#666666-fg}No active missions.\n\n` +
        `{#444444-fg}Send fleets to explore the galaxy.{/}`
    );

    shipyardBox.setContent(
      `\n{#666666-fg}Shipyard not yet constructed.\n\n` +
        `{#444444-fg}Build a Shipyard on the Production tab to unlock ship construction.{/}`
    );
  };

  return {
    container,
    render,
    show: () => container.show(),
    hide: () => container.hide(),
  };
};


