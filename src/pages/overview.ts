import blessed from "blessed";
import { GameState } from "../types";
import { calculateProduction, getUpgradeProgress, isUpgrading } from "../state";
import { formatTime } from "../utils";
import { icons } from "../utils/icons";

export const createOverviewPage = (
  parent: blessed.Widgets.BoxElement,
  getState: () => GameState
) => {
  const container = blessed.box({
    parent,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    hidden: false,
  });

  // Production Summary
  const productionBox = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: "50%",
    height: "50%",
    label: ` {bold}${icons.production} PRODUCTION{/bold} `,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#b8c4ce" },
    },
    padding: { left: 1, right: 1 },
  });

  // Planets
  const planetsBox = blessed.box({
    parent: container,
    top: 0,
    left: "50%",
    width: "50%",
    height: "50%",
    label: ` {bold}${icons.planets} PLANETS{/bold} `,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#00ff88" },
    },
    padding: { left: 1, right: 1 },
  });

  // Fleet
  const fleetBox = blessed.box({
    parent: container,
    top: "50%",
    left: 0,
    width: "50%",
    height: "50%",
    label: ` {bold}${icons.fleet} FLEET{/bold} `,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#ff6b35" },
    },
    padding: { left: 1, right: 1 },
  });

  // Research
  const researchBox = blessed.box({
    parent: container,
    top: "50%",
    left: "50%",
    width: "50%",
    height: "50%",
    label: ` {bold}${icons.research} RESEARCH{/bold} `,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#cc66ff" },
    },
    padding: { left: 1, right: 1 },
  });

  const render = () => {
    const state = getState();
    const production = calculateProduction(state.metalFactory.level);
    const upgrading = isUpgrading(state);

    let prodSummary =
      `\n{#b8c4ce-fg}Metal Factory{/} {#666666-fg}Lvl {/}{#00d4ff-fg}${state.metalFactory.level}{/}\n` +
      `{#666666-fg}Output: {#00ff88-fg}+${production.toFixed(2)}/sec{/}\n`;

    if (upgrading) {
      const progress = getUpgradeProgress(state);
      if (progress) {
        prodSummary += `\n{#ffcc00-fg}${
          icons.upgrade
        } Upgrading... ${formatTime(progress.remaining)}{/}`;
      }
    }
    productionBox.setContent(prodSummary);

    planetsBox.setContent(
      `\n{#666666-fg}No planets discovered yet.\n\n` +
        `{#444444-fg}Coming soon...{/}`
    );

    fleetBox.setContent(
      `\n{#666666-fg}No ships constructed yet.\n\n` +
        `{#444444-fg}Coming soon...{/}`
    );

    researchBox.setContent(
      `\n{#666666-fg}No research available yet.\n\n` +
        `{#444444-fg}Coming soon...{/}`
    );
  };

  return {
    container,
    render,
    show: () => container.show(),
    hide: () => container.hide(),
  };
};
