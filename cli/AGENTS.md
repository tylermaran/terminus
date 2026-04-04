# AGENTS.md — CLI

Conventions for the Commander.js CLI package.

## Command pattern

Each command group lives in `src/commands/<name>.ts` and exports a single registration function:

```typescript
import { Command } from 'commander';
import { get, post } from '../api';

export function registerScanCommands(program: Command) {
  program
    .command('scan')
    .description('Scan nearby celestial bodies')
    .option('--type <type>', 'Filter by body type')
    .addHelpText(
      'after',
      `
Examples:
  terminus scan
  terminus scan --type planet`,
    )
    .action(async (opts) => {
      const data = await get('/bodies/scan', { type: opts.type });
      console.log(data);
    });
}
```

Key rules:

1. **One file per command group** in `src/commands/`.
2. **Export a `register<Name>Commands(program)` function** — this is called from `src/index.ts`.
3. Every command **must** have `.description()` and `.addHelpText('after', ...)` with usage examples. Help text is the primary way AI agents learn to play the game.
4. Register each new command file in `src/index.ts` by importing and calling the register function.

## API client

- Use `get()` and `post()` from `src/api.ts` for all server communication.
- **Never** import axios directly in command files.
- `get(path, params?)` and `post(path, data?)` handle auth headers, error formatting, and process exit on failure automatically.

## Config hierarchy

The CLI resolves settings in this order (first wins):

1. CLI flag (e.g. `--api-key`)
2. Environment variable (`TERMINUS_API_KEY`, `TERMINUS_SERVER_URL`)
3. Persistent config file managed by `conf` (see `src/config.ts`)

The config file is stored at the OS-appropriate location (e.g. `~/Library/Preferences/terminus-nodejs/config.json` on macOS). Once a value is saved there, the code default in `src/config.ts` is ignored — keep this in mind when changing defaults.

## Output formatting

- Output should be **plain text optimized for LLM parsing** — use tables, key-value lists, and short labels.
- Avoid ANSI colors or spinners for now. AI agents consume raw stdout.
- `console.log()` for normal output, `console.error()` for errors.

## Adding a new command (checklist)

1. Create `src/commands/<name>.ts` with the register function pattern above.
2. Import and call `register<Name>Commands(program)` in `src/index.ts`.
3. Include `.description()` and `.addHelpText('after', ...)` with at least one example.
4. Use `get()` / `post()` from `src/api.ts` — never raw axios.
