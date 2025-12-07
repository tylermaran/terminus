import blessed from "blessed";
import { Planet, ZoomLevel } from "../types";
import { starSystems } from "../data/planets";
import { generateStarfield, twinkleStars } from "../utils";

// Map state
let currentZoom: ZoomLevel = "system";
let selectedStarIndex = 0;
let selectedPlanetIndex = 3;
let starfield: string[][] = generateStarfield(80, 25);

export const getCurrentPlanets = (): Planet[] => {
  return starSystems[selectedStarIndex].planets;
};

export const getMapState = () => ({
  currentZoom,
  selectedStarIndex,
  selectedPlanetIndex,
});

export const setZoom = (zoom: ZoomLevel) => {
  currentZoom = zoom;
};

export const setSelectedStar = (index: number) => {
  selectedStarIndex = index;
};

export const setSelectedPlanet = (index: number) => {
  selectedPlanetIndex = index;
};

export const createMapPage = (
  parent: blessed.Widgets.BoxElement,
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

  // Map View
  const mapView = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: "100%-25",
    height: "100%",
    label: " {bold}🌌 SOLAR SYSTEM{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      bg: "#000005",
      border: { fg: "#1a4a6e" },
      label: { fg: "#00d4ff" },
    },
  });

  // Planet Info
  const mapInfo = blessed.box({
    parent: container,
    top: 0,
    right: 0,
    width: 25,
    height: "60%",
    label: " {bold}PLANET INFO{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      border: { fg: "#1a4a6e" },
      label: { fg: "#ffcc00" },
    },
    padding: { left: 1, right: 1 },
  });

  // Controls
  const mapControls = blessed.box({
    parent: container,
    top: "60%",
    right: 0,
    width: 25,
    height: "40%",
    label: " {bold}CONTROLS{/bold} ",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "#888888",
      border: { fg: "#1a4a6e" },
      label: { fg: "#666666" },
    },
    padding: { left: 1, right: 1 },
  });

  const render = () => {
    // Safely get dimensions with proper fallbacks
    let mapWidth = 60;
    let mapHeight = 20;

    if (mapView.width) {
      const w =
        typeof mapView.width === "number"
          ? mapView.width
          : parseInt(String(mapView.width), 10);
      if (!isNaN(w) && w > 0) {
        mapWidth = w - 2;
      }
    }

    if (mapView.height) {
      const h =
        typeof mapView.height === "number"
          ? mapView.height
          : parseInt(String(mapView.height), 10);
      if (!isNaN(h) && h > 0) {
        mapHeight = h - 2;
      }
    }

    // Ensure minimum dimensions
    mapWidth = Math.max(10, mapWidth);
    mapHeight = Math.max(10, mapHeight);

    // Regenerate starfield if size changed
    if (
      !starfield ||
      starfield.length !== mapHeight ||
      (starfield[0] && starfield[0].length !== mapWidth)
    ) {
      starfield = generateStarfield(mapWidth, mapHeight);
    }

    let mapContent = "";
    let infoContent = "";

    if (currentZoom === "stars") {
      // GALAXY VIEW
      mapView.setLabel(" {bold}🌌 GALAXY MAP{/bold} ");

      const mapBuffer: string[][] = starfield.map((row) => [...row]);

      starSystems.forEach((star, index) => {
        const sx = Math.floor((star.x / 100) * (mapWidth - 1));
        const sy = Math.floor((star.y / 100) * (mapHeight - 1));

        if (sy >= 0 && sy < mapHeight && sx >= 0 && sx < mapWidth) {
          const isSelected = index === selectedStarIndex;
          if (isSelected) {
            if (sx > 0) mapBuffer[sy][sx - 1] = `{#ffffff-fg}[{/}`;
            if (sx < mapWidth - 1) mapBuffer[sy][sx + 1] = `{#ffffff-fg}]{/}`;
          }
          mapBuffer[sy][sx] = `{${star.color}-fg}★{/}`;
        }
      });

      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          const char = mapBuffer[y][x];
          if (char === "." || char === "·") {
            mapContent += `{#222222-fg}${char}{/}`;
          } else if (char === "+" || char === "*") {
            mapContent += `{#333333-fg}${char}{/}`;
          } else {
            mapContent += char;
          }
        }
        if (y < mapHeight - 1) mapContent += "\n";
      }

      const selectedStar = starSystems[selectedStarIndex];
      infoContent =
        `\n{bold}{${selectedStar.color}-fg}★ ${selectedStar.name}{/}\n\n` +
        `{#666666-fg}Type:{/} ${selectedStar.type} star\n\n` +
        `{#666666-fg}Planets:{/} ${selectedStar.planets.length}\n\n` +
        `{#00ff88-fg}Press + to enter{/}`;
    } else if (currentZoom === "system") {
      // SOLAR SYSTEM VIEW
      const currentSystem = starSystems[selectedStarIndex];
      mapView.setLabel(` {bold}🌌 ${currentSystem.name.toUpperCase()}{/bold} `);

      const mapBuffer: string[][] = starfield.map((row) => [...row]);
      const planets = getCurrentPlanets();

      const starX = Math.floor(mapWidth / 2);
      const starY = Math.floor(mapHeight / 2);

      // Ensure bounds
      if (starY >= 0 && starY < mapHeight && starX >= 0 && starX < mapWidth) {
        if (mapBuffer[starY]) {
          mapBuffer[starY][starX] = `{${currentSystem.color}-fg}☀{/}`;
        }
      }

      planets.forEach((planet, index) => {
        const px = Math.floor((planet.x / 100) * (mapWidth - 1));
        const py = Math.floor((planet.y / 100) * (mapHeight - 1));

        if (py >= 0 && py < mapHeight && px >= 0 && px < mapWidth) {
          const isSelected = index === selectedPlanetIndex;
          if (isSelected) {
            if (px > 0) mapBuffer[py][px - 1] = `{#ffffff-fg}[{/}`;
            if (px < mapWidth - 1) mapBuffer[py][px + 1] = `{#ffffff-fg}]{/}`;
          }
          mapBuffer[py][px] = `{${planet.color}-fg}${planet.symbol}{/}`;
        }
      });

      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          const char = mapBuffer[y][x];
          if (char === "." || char === "·") {
            mapContent += `{#333333-fg}${char}{/}`;
          } else if (char === "+" || char === "*") {
            mapContent += `{#555555-fg}${char}{/}`;
          } else {
            mapContent += char;
          }
        }
        if (y < mapHeight - 1) mapContent += "\n";
      }

      const selectedPlanet = planets[selectedPlanetIndex];
      infoContent =
        `\n{bold}{${selectedPlanet.color}-fg}${selectedPlanet.symbol} ${selectedPlanet.name}{/}\n\n` +
        `{#666666-fg}Size:{/} ${selectedPlanet.size}\n\n` +
        `{#666666-fg}Info:{/}\n` +
        `{#888888-fg}${selectedPlanet.info}{/}\n\n` +
        `{#00ff88-fg}+ zoom in{/} {#ff6b35-fg}- zoom out{/}`;
    } else if (currentZoom === "planet") {
      // PLANET VIEW
      const planets = getCurrentPlanets();
      const planet = planets[selectedPlanetIndex];
      mapView.setLabel(` {bold}🌍 ${planet.name.toUpperCase()}{/bold} `);

      const planetArt: string[] = [];
      if (planet.size === "large") {
        planetArt.push(
          `           {${planet.color}-fg}░░░░░░░░░░░░{/}`,
          `       {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░{/}`,
          `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
          `   {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
          `  {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
          `  {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
          `  {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
          `   {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
          `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░░░░░{/}`,
          `       {${planet.color}-fg}░░░░░░░░░░░░░░░░░░░░{/}`,
          `           {${planet.color}-fg}░░░░░░░░░░░░{/}`
        );
      } else if (planet.size === "medium") {
        planetArt.push(
          `         {${planet.color}-fg}░░░░░░░░░░{/}`,
          `       {${planet.color}-fg}░░░░░░░░░░░░░░{/}`,
          `      {${planet.color}-fg}░░░░░░░░░░░░░░░░{/}`,
          `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░{/}`,
          `     {${planet.color}-fg}░░░░░░░░░░░░░░░░░░{/}`,
          `      {${planet.color}-fg}░░░░░░░░░░░░░░░░{/}`,
          `       {${planet.color}-fg}░░░░░░░░░░░░░░{/}`,
          `         {${planet.color}-fg}░░░░░░░░░░{/}`
        );
      } else {
        planetArt.push(
          `           {${planet.color}-fg}░░░░{/}`,
          `         {${planet.color}-fg}░░░░░░░░{/}`,
          `        {${planet.color}-fg}░░░░░░░░░░{/}`,
          `        {${planet.color}-fg}░░░░░░░░░░{/}`,
          `         {${planet.color}-fg}░░░░░░░░{/}`,
          `           {${planet.color}-fg}░░░░{/}`
        );
      }

      const startY = Math.floor((mapHeight - planetArt.length) / 2);
      const lines: string[] = [];

      for (let y = 0; y < mapHeight; y++) {
        if (y >= startY && y < startY + planetArt.length) {
          lines.push(planetArt[y - startY]);
        } else {
          let line = "";
          for (let x = 0; x < mapWidth; x++) {
            const char = starfield[y]?.[x] || " ";
            if (char === "." || char === "·") {
              line += `{#222222-fg}${char}{/}`;
            } else if (char === "+" || char === "*") {
              line += `{#333333-fg}${char}{/}`;
            } else {
              line += " ";
            }
          }
          lines.push(line);
        }
      }

      mapContent = lines.join("\n");

      infoContent =
        `\n{bold}{${planet.color}-fg}${planet.symbol} ${planet.name}{/}\n\n` +
        `{#666666-fg}Classification:{/}\n` +
        `  ${planet.size} celestial body\n\n` +
        `{#666666-fg}Description:{/}\n` +
        `{#888888-fg}${planet.info}{/}\n\n` +
        `{#666666-fg}Status:{/}\n` +
        `  ${
          planet.symbol === "◎"
            ? "{#00ff88-fg}Colonized{/}"
            : "{#888888-fg}Unexplored{/}"
        }\n\n` +
        `{#ff6b35-fg}- zoom out{/}`;
    }

    mapView.setContent(mapContent);
    mapInfo.setContent(infoContent);

    const zoomIndicator =
      currentZoom === "stars"
        ? "◉○○"
        : currentZoom === "system"
        ? "○◉○"
        : "○○◉";
    mapControls.setContent(
      `{#ffcc00-fg}Zoom:{/} ${zoomIndicator}\n` +
        `{#00ff88-fg}[+]{/} Zoom in\n` +
        `{#ff6b35-fg}[-]{/} Zoom out\n\n` +
        `{#00d4ff-fg}[Tab]{/} Next\n` +
        `{#00d4ff-fg}[←→↑↓]{/} Navigate`
    );
  };

  // Twinkle function for external calls
  const doTwinkle = () => {
    twinkleStars(starfield);
  };

  return {
    container,
    render,
    show: () => container.show(),
    hide: () => container.hide(),
    twinkle: doTwinkle,
  };
};
