---
name: play-terminus
description: Play the Terminus space conquest CLI game. Use when the user asks to play Terminus, manage their space empire, build structures, research technologies, or interact with the Terminus game.
---

# Play Terminus

Terminus is a real-time CLI space conquest game. Claim celestial bodies, build structures, mine resources, and research technologies. Resources accumulate passively while you wait.

## Prerequisites

The game server must be running and the galaxy must be seeded:

```bash
# Ensure server is running (check terminals first)
make server

# If `terminus scan` returns no bodies, seed the galaxy
make db-seed
```

The `terminus` shim must be installed (`make shim`) or use `make cli CMD="<command>"`.

## Authentication

```bash
# First time: register and login (you are auto-assigned a homeworld planet)
terminus register <username>
terminus login <api-key>

# API key can also be set via env var
export TERMINUS_API_KEY=<key>
```

Registration automatically assigns you a planet as your homeworld with 500 starting minerals and 200 energy. Config is stored at the path shown by `terminus login`. The server URL defaults to `http://localhost:3333`.

## Core Game Loop

### 1. Scout Your Surroundings

```bash
terminus scan --type planet --sort richness   # Find best planets
terminus scan --type moon --sort richness      # Moons are smaller but can be rich
terminus scan --type asteroid --sort richness   # Asteroids have highest richness
```

The `Dist.` column shows distance from your homeworld — useful for planning future expansion.

### 2. Build Infrastructure

```bash
terminus build <body-id> mine          # 100 minerals, 5 min build, +10 minerals/hr
terminus build <body-id> power_plant   # 100 minerals, 5 min build, +10 energy/hr
terminus build <body-id> research_lab  # 200 minerals + 100 energy, 15 min build, +5 research/hr
terminus build <body-id> refinery      # 200 minerals + 50 energy, 15 min build, +5 alloys/hr (needs basic_industry)
```

### 3. Research Technologies

Requires a research lab and sufficient research points.

```bash
terminus research list              # See available/locked techs
terminus research start <tech-id>   # Spend points to begin research
```

### 4. Monitor and Expand

```bash
terminus status                     # Empire overview: resources, bodies, construction queue
terminus body <body-id>             # Detailed view of a single body
```

### 5. Keep a Captain's Log

```bash
terminus log add "building 2 mines on homeworld" --tag strategy
terminus log list --tag strategy
```

## Production Reference

All rates are **per hour**. Mineral/energy/alloy production is multiplied by the body's `resourceRichness`. Research points are **not** multiplied by richness.

| Structure    | Cost                 | Build Time | Produces                                 | Prereq         |
| ------------ | -------------------- | ---------- | ---------------------------------------- | -------------- |
| mine         | 100 minerals         | 5 min      | +10 minerals/hr × richness               | —              |
| power_plant  | 100 minerals         | 5 min      | +10 energy/hr × richness                 | —              |
| research_lab | 200 min + 100 energy | 15 min     | +5 research pts/hr                       | —              |
| refinery     | 200 min + 50 energy  | 15 min     | +5 alloys/hr × richness, −10 minerals/hr | basic_industry |

Planets also generate passive credits at `radius × 0.1 per hour`.

## Tech Tree

| Technology        | Cost    | Duration | Effect                             | Prereq         |
| ----------------- | ------- | -------- | ---------------------------------- | -------------- |
| basic_industry    | 50 pts  | 30 min   | Unlocks refinery                   | —              |
| advanced_mining   | 100 pts | 60 min   | 2× mine output                     | basic_industry |
| energy_efficiency | 100 pts | 60 min   | 2× power plant output              | —              |
| alloy_synthesis   | 150 pts | 120 min  | 2× refinery output, ½ mineral cost | basic_industry |

## Strategy Guide

### Opening Build Order

1. After registering, check your homeworld with `terminus status`
2. Build 2× mine (uses 200 of your 500 starting minerals)
3. Build 1× power_plant (100 minerals)
4. Build 1× research_lab (200 minerals + 100 energy — uses all starting resources)
5. Wait for research points to accumulate (~7 hrs for 50 pts with one lab)
6. Research `basic_industry` → unlocks refineries

### Key Insights

- **Richness matters** — your homeworld's richness multiplies mineral/energy/alloy output
- **Research points ignore richness** — lab placement doesn't matter for research speed
- **Mines before everything** — you need minerals for all structures
- **Refineries consume minerals** — ensure net mineral rate stays positive
- **Resources accumulate passively** — check back later with `terminus status`
- **Construction completes in real time** — mines/plants take 5 min, labs/refineries take 15 min

### Resource Planning

With richness R and no tech upgrades:

- 1 mine = 10R minerals/hr
- 1 power_plant = 10R energy/hr
- 1 refinery = 5R alloys/hr but costs 10 minerals/hr
- 1 research_lab = 5 research pts/hr (flat)

### When to Check Back

Use `terminus status` to see current resources and construction progress. The game runs in real time:

- **5 min**: mines and power plants finish building
- **15 min**: research labs and refineries finish building
- **30 min–2 hrs**: meaningful resource accumulation depending on structure count
- **7+ hrs**: enough research points for first technology (with one lab)
