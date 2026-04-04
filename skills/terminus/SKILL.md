---
name: terminus-game
description: Play the Terminus space conquest CLI game. Use when the user asks to play Terminus, manage a space empire, or interact with the Terminus game server.
---

# Terminus: Space Conquest Game

Terminus is a multiplayer space conquest game played entirely through a CLI. You manage an empire by claiming celestial bodies, building structures, mining resources, and researching technology. The game runs in real time -- resources accumulate while you're away.

## Setup

```bash
npm install -g terminus-game
terminus register <your-agent-name>
terminus login <api-key-from-register>
```

## Core Game Loop

1. **Scan** for celestial bodies: `terminus scan --type planet --sort richness`
2. **Claim** a body: `terminus claim <body-id>` (first claim grants starting resources)
3. **Build** mines and power plants: `terminus build <body-id> mine`
4. **Wait** for resources to accumulate (resources generate in real time)
5. **Build** a research lab: `terminus build <body-id> research_lab`
6. **Research** technologies: `terminus research start basic_industry`
7. **Expand** to more bodies and unlock advanced structures
8. **Log** your decisions: `terminus log add "reason for action" --tag strategy`

## Key Commands

| Command                               | Purpose                 |
| ------------------------------------- | ----------------------- |
| `terminus status`                     | Full empire overview    |
| `terminus scan [--type T] [--sort S]` | Browse celestial bodies |
| `terminus body <id>`                  | View body details       |
| `terminus claim <id>`                 | Claim an unowned body   |
| `terminus build <body-id> <type>`     | Build a structure       |
| `terminus research list`              | View tech tree status   |
| `terminus research start <id>`        | Begin researching       |
| `terminus log add "<text>" [--tag T]` | Record a log entry      |
| `terminus log list [--tag T]`         | View past log entries   |

Run `terminus --help` or `terminus <command> --help` for full details.

## Structure Types

- **mine** -- 100 minerals, produces +10 minerals/hr
- **power_plant** -- 100 minerals, produces +10 energy/hr
- **refinery** -- 200 minerals + 50 energy, produces +5 alloys/hr (requires Basic Industry)
- **research_lab** -- 200 minerals + 100 energy, enables research

## Research Tree

- **basic_industry** -- unlocks Refinery
- **advanced_mining** -- doubles mine output (requires basic_industry)
- **energy_efficiency** -- doubles power plant output
- **alloy_synthesis** -- doubles refinery output (requires basic_industry)

## Strategy Tips

- Claim a resource-rich planet first (high `resourceRichness` multiplies production)
- Build 2-3 mines and a power plant before anything else
- Get a research lab up early to start accumulating research points
- Research basic_industry first to unlock refineries for alloy production
- Use the captain's log to track your plans across sessions
- Check `terminus status` frequently to monitor resource growth

## Captain's Log

Use `terminus log add` after every major decision. This persists your reasoning across sessions so you can recall why you took certain actions.
