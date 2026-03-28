import blessed from "blessed";
import { GameState } from "../types";
import {
  calculateCurrentMetal,
  SHIP_DEFINITIONS,
  getShipDefinition,
} from "../state";
import { formatNumber, formatTime } from "../utils";

type FleetPageMode = "list" | "build";

export interface FleetPageState {
  selectedShipIndex: number;
  mode: FleetPageMode;
  buildQuantity: number;
}

const createFleetPageState = (): FleetPageState => ({
  selectedShipIndex: 0,
  mode: "list",
  buildQuantity: 1,
});

export const createFleetPage = (
  parent: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  tabList: blessed.Widgets.ListElement,
  getState: () => GameState,
  onBuildShip: (shipType: string, quantity: number) => Promise<void>
) => {
  const container = blessed.box({
    parent,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    hidden: true,
  });

  // Shipyard - List of ships (left column, full height)
  const shipyardBox = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: "50%",
    height: "100%",
    label: " {bold}🔧 SHIPYARD{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#00ff88" },
    },
    padding: { left: 1, right: 1 },
    scrollable: true,
    alwaysScroll: true,
    focusable: true,
    keys: true,
  });

  let focused = false;

  // Ship Preview (top right, where Active Missions was)
  const previewBox = blessed.box({
    parent: container,
    top: 0,
    left: "50%",
    width: "50%",
    height: "60%",
    label: " {bold}📋 SHIP PREVIEW{/bold} ",
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
  });

  // Build Mode Box (bottom right)
  const buildBox = blessed.box({
    parent: container,
    top: "60%",
    left: "50%",
    width: "50%",
    height: "40%",
    label: " {bold}⚙ BUILD{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#ff6b35" },
    },
    padding: { left: 1, right: 1 },
    hidden: true,
  });

  const pageState = createFleetPageState();

  // Update shipyard list with ships
  const updateShipyardList = () => {
    let content = `\n`;
    SHIP_DEFINITIONS.forEach((ship, index) => {
      if (index === pageState.selectedShipIndex) {
        content += `{#00d4ff-fg}{bold}▶ ${ship.name}{/}{/}\n`;
      } else {
        content += `   {#888888-fg}${ship.name}{/}\n`;
      }
    });
    content += `\n`;
    if (focused) {
      content += `{#666666-fg}↑↓ navigate, Enter to build, Esc to exit{/}`;
    } else {
      content += `{#666666-fg}Press Enter to focus shipyard{/}`;
    }
    shipyardBox.setContent(content);
  };

  // Render ship preview
  const renderPreview = () => {
    const state = getState();
    const selectedShip = SHIP_DEFINITIONS[pageState.selectedShipIndex];

    if (!selectedShip) {
      previewBox.setContent("\n{#666666-fg}No ship selected.{/}");
      return;
    }

    const currentMetal = calculateCurrentMetal(state);
    const canAfford = currentMetal >= selectedShip.cost;

    let content = `\n`;
    content += `{bold}{#00d4ff-fg}${selectedShip.name}{/}{/}\n\n`;
    content += `{#666666-fg}${selectedShip.description}{/}\n\n`;
    content += `{#666666-fg}Cost:{/}        `;
    if (canAfford) {
      content += `{#00ff88-fg}${formatNumber(selectedShip.cost)} metal{/}\n`;
    } else {
      content += `{#ff3366-fg}${formatNumber(selectedShip.cost)} metal{/}\n`;
    }
    content += `{#666666-fg}Production:{/}  {#00d4ff-fg}${formatTime(
      selectedShip.productionTime
    )}{/}\n`;
    content += `{#666666-fg}Attack:{/}      {#ff3366-fg}${selectedShip.attack}{/}\n`;
    content += `{#666666-fg}Defense:{/}     {#00ff88-fg}${selectedShip.defense}{/}\n`;

    previewBox.setContent(content);
  };

  // Render build box
  const renderBuildBox = () => {
    const state = getState();
    const selectedShip = SHIP_DEFINITIONS[pageState.selectedShipIndex];

    if (!selectedShip) {
      buildBox.setContent("\n{#666666-fg}No ship selected.{/}");
      return;
    }

    const currentMetal = calculateCurrentMetal(state);
    const totalCost = selectedShip.cost * pageState.buildQuantity;
    const canAfford = currentMetal >= totalCost;
    const maxAffordable = Math.floor(currentMetal / selectedShip.cost);

    let content = `\n`;
    content += `{bold}{#00d4ff-fg}${selectedShip.name}{/}{/}\n\n`;
    content += `{#666666-fg}Quantity:{/}    {bold}{#00ff88-fg}${pageState.buildQuantity}{/}{/}\n`;
    content += `{#666666-fg}Total Cost:{/}  `;
    if (canAfford) {
      content += `{#00ff88-fg}${formatNumber(totalCost)} metal{/}\n`;
    } else {
      content += `{#ff3366-fg}${formatNumber(totalCost)} metal{/}\n`;
    }
    content += `{#666666-fg}Available:{/}   {#888888-fg}${formatNumber(
      currentMetal
    )} metal{/}\n`;
    if (maxAffordable > 0 && pageState.buildQuantity > maxAffordable) {
      content += `{#ff3366-fg}Max affordable: ${maxAffordable}{/}\n`;
    }
    content += `\n`;

    if (canAfford && pageState.buildQuantity > 0) {
      content += `{#00ff88-fg}Press [ENTER] to build{/}\n`;
    } else if (pageState.buildQuantity <= 0) {
      content += `{#ff3366-fg}Invalid quantity{/}\n`;
    } else {
      const needed = totalCost - currentMetal;
      content += `{#ff3366-fg}Need ${formatNumber(needed)} more metal{/}\n`;
    }

    content += `\n{#888888-fg}Use +/- to change quantity{/}\n`;
    content += `{#888888-fg}Press [ESC] to cancel{/}`;

    buildBox.setContent(content);
  };

  const render = () => {
    const state = getState();
    updateShipyardList();
    renderPreview();

    // Update shipyard border color based on focus state
    shipyardBox.style.border.fg = focused ? "#00d4ff" : "#1a4a6e";

    if (pageState.mode === "build") {
      buildBox.show();
      renderBuildBox();
    } else {
      buildBox.hide();
    }
  };

  // Focus management (similar to chat)
  const focusShipyard = () => {
    focused = true;
    shipyardBox.focus();
    render();
    screen.render();
  };

  const unfocus = () => {
    focused = false;
    tabList.focus();
    render();
    screen.render();
  };

  // Keyboard handlers - will be set up from index.ts
  const setupKeyboardHandlers = (
    isFleetTab: () => boolean,
    isCommandModalOpen: () => boolean,
    isChatInputActive: () => boolean
  ) => {
    // Arrow keys for navigation (only when focused and in list mode)
    const handleArrow = (direction: "up" | "down") => {
      if (isCommandModalOpen() || isChatInputActive()) return;
      if (!isFleetTab() || !focused) return;
      if (pageState.mode !== "list") return;

      if (direction === "up") {
        pageState.selectedShipIndex = Math.max(
          0,
          pageState.selectedShipIndex - 1
        );
      } else {
        pageState.selectedShipIndex = Math.min(
          SHIP_DEFINITIONS.length - 1,
          pageState.selectedShipIndex + 1
        );
      }
      render();
      screen.render();
    };

    // Enter to focus shipyard, switch to build mode, or confirm build
    const handleEnter = () => {
      if (isCommandModalOpen() || isChatInputActive()) return;
      if (!isFleetTab()) return;

      // If not focused, focus the shipyard first
      if (!focused) {
        focusShipyard();
        return;
      }

      if (pageState.mode === "list") {
        pageState.mode = "build";
        pageState.buildQuantity = 1;
        buildBox.show();
        render();
        screen.render();
      } else if (pageState.mode === "build") {
        const selectedShip = SHIP_DEFINITIONS[pageState.selectedShipIndex];
        if (selectedShip) {
          const state = getState();
          const totalCost = selectedShip.cost * pageState.buildQuantity;
          const currentMetal = calculateCurrentMetal(state);
          if (currentMetal >= totalCost && pageState.buildQuantity > 0) {
            onBuildShip(selectedShip.name, pageState.buildQuantity)
              .then(() => {
                pageState.mode = "list";
                buildBox.hide();
                render();
                screen.render();
              })
              .catch((err) => {
                console.error("Build ship failed:", err);
              });
          }
        }
      }
    };

    // Escape to exit build mode or unfocus shipyard
    const handleEscape = (): boolean => {
      if (isCommandModalOpen() || isChatInputActive()) return false;
      if (!isFleetTab()) return false;

      if (pageState.mode === "build") {
        pageState.mode = "list";
        buildBox.hide();
        render();
        screen.render();
        return true;
      } else if (focused) {
        // Unfocus and return to tab navigation
        unfocus();
        return true;
      }
      return false;
    };

    // Plus/minus to change quantity in build mode
    const handleQuantityChange = (delta: number) => {
      if (isCommandModalOpen() || isChatInputActive()) return;
      if (!isFleetTab() || !focused) return;
      if (pageState.mode !== "build") return;

      const newQuantity = Math.max(1, pageState.buildQuantity + delta);
      const state = getState();
      const selectedShip = SHIP_DEFINITIONS[pageState.selectedShipIndex];
      if (selectedShip) {
        const currentMetal = calculateCurrentMetal(state);
        const maxAffordable = Math.floor(currentMetal / selectedShip.cost);
        pageState.buildQuantity = Math.min(
          newQuantity,
          Math.max(1, maxAffordable > 0 ? maxAffordable : 999999)
        );
      } else {
        pageState.buildQuantity = newQuantity;
      }
      render();
      screen.render();
    };

    return {
      handleArrow,
      handleEnter,
      handleEscape,
      handleQuantityChange,
    };
  };

  return {
    container,
    render,
    show: () => {
      container.show();
      pageState.mode = "list";
      pageState.selectedShipIndex = 0;
      pageState.buildQuantity = 1;
      focused = false;
      buildBox.hide();
      render();
    },
    hide: () => {
      focused = false;
      container.hide();
    },
    setupKeyboardHandlers,
    getState: () => pageState,
    isFocused: () => focused,
    focusShipyard,
    unfocus,
  };
};
