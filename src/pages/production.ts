import blessed from "blessed";
import { GameState } from "../types";
import {
  calculateProduction,
  calculateUpgradeCost,
  calculateUpgradeDuration,
  calculateCurrentMetal,
  getUpgradeProgress,
  isUpgrading,
} from "../state";
import { formatNumber, formatTime, progressBar } from "../utils";
import { icons } from "../utils/icons";

export const createProductionPage = (
  parent: blessed.Widgets.BoxElement,
  getState: () => GameState
) => {
  const container = blessed.box({
    parent,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    hidden: true,
  });

  // Metal ledger
  const metalBox = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: "50%",
    height: 7,
    label: " {bold}◈ METAL LEDGER{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#b8c4ce" },
    },
    padding: { left: 1, right: 1 },
  });

  // Factory status
  const factoryBox = blessed.box({
    parent: container,
    top: 0,
    left: "50%",
    width: "50%",
    height: 7,
    label: ` {bold}${icons.factory} FACTORY STATUS{/bold} `,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#ff6b35" },
    },
    padding: { left: 1, right: 1 },
  });

  // Upgrade panel
  const upgradeBox = blessed.box({
    parent: container,
    top: 7,
    left: 0,
    width: "100%",
    height: "100%-7",
    label: " {bold}⬆ UPGRADE{/bold} ",
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
    const state = getState();
    const currentMetal = calculateCurrentMetal(state);
    const production = calculateProduction(state.metalFactory.level);
    const upgrading = isUpgrading(state);

    // Metal ledger
    const metalContent =
      `\n{bold}{#b8c4ce-fg}${icons.metal}  TOTAL METAL{/}\n\n` +
      `   {bold}{#00d4ff-fg}${formatNumber(currentMetal)}{/}`;
    metalBox.setContent(metalContent);

    // Factory status
    let factoryContent =
      `\n{#ff6b35-fg}Level:{/} {bold}${state.metalFactory.level}{/}\n` +
      `{#666666-fg}Output:{/} {#b8c4ce-fg}${production.toFixed(2)}/sec{/}\n`;

    if (upgrading) {
      factoryContent += `{#ffcc00-fg}${icons.upgrade} UPGRADING...{/}`;
    } else {
      factoryContent += `{#00ff88-fg}${icons.producing} PRODUCING{/}`;
    }
    factoryBox.setContent(factoryContent);

    // Upgrade panel
    const nextLevel = state.metalFactory.level + 1;
    const upgradeCost = calculateUpgradeCost(state.metalFactory.level);
    const upgradeDuration = calculateUpgradeDuration(state.metalFactory.level);
    const nextProduction = calculateProduction(nextLevel);
    const canAfford = currentMetal >= upgradeCost;

    let upgradeContent: string;
    const progress = getUpgradeProgress(state);

    if (progress) {
      upgradeContent =
        `{bold}{#ffcc00-fg}${icons.upgrade} UPGRADING TO LEVEL ${nextLevel}{/}\n\n` +
        `   ${progressBar(progress.progress)}\n\n` +
        `   {#666666-fg}Time remaining:{/} {bold}{#00d4ff-fg}${formatTime(
          progress.remaining
        )}{/}\n\n` +
        `   {#666666-fg}New production:{/} {#00ff88-fg}${nextProduction.toFixed(
          2
        )}/sec{/} ` +
        `{#666666-fg}(+${(nextProduction - production).toFixed(2)}){/}`;
    } else {
      const costColor = canAfford ? "#00ff88" : "#ff3366";
      upgradeContent =
        `{bold}Upgrade to Level ${nextLevel}{/}\n\n` +
        `   {#666666-fg}Cost:{/}        {${costColor}-fg}${formatNumber(
          upgradeCost
        )} metal{/}\n` +
        `   {#666666-fg}Duration:{/}    {#00d4ff-fg}${formatTime(
          upgradeDuration
        )}{/}\n` +
        `   {#666666-fg}Production:{/}  {#b8c4ce-fg}${production.toFixed(
          2
        )}{/} → {#00ff88-fg}${nextProduction.toFixed(2)}/sec{/}\n\n` +
        (canAfford
          ? `   {#00ff88-fg}Press [U] to upgrade{/}`
          : `   {#ff3366-fg}Need ${formatNumber(
              upgradeCost - currentMetal
            )} more metal{/}`);
    }
    upgradeBox.setContent(upgradeContent);
  };

  return {
    container,
    render,
    show: () => container.show(),
    hide: () => container.hide(),
  };
};
