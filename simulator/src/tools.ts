import { tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import type { Logger } from './log';

const execAsync = promisify(exec);
const CLI_DIR = path.resolve(__dirname, '../../cli');

export function createTools(apiKey: string, serverUrl: string, log: Logger) {
  return {
    terminus: tool({
      description:
        'Run a terminus CLI command. Pass the arguments exactly as you would after "terminus", e.g. "scan --type planet --sort richness" or "build <body-id> mine".',
      inputSchema: z.object({
        args: z.string().describe('The terminus command and arguments (without the "terminus" prefix)'),
      }),
      execute: async ({ args }) => {
        log.cmd(args);
        try {
          const { stdout } = await execAsync(`pnpm exec tsx src/index.ts ${args}`, {
            cwd: CLI_DIR,
            env: {
              ...process.env,
              TERMINUS_API_KEY: apiKey,
              TERMINUS_SERVER_URL: serverUrl,
            },
            timeout: 30_000,
          });
          const result = stdout.trim() || '(no output)';
          log.result(result.split('\n')[0] + (result.includes('\n') ? ' ...' : ''));
          return result;
        } catch (err: unknown) {
          const e = err as { stdout?: string; stderr?: string; message?: string };
          const result = `Error: ${e.stdout || e.stderr || e.message || 'command failed'}`.trim();
          log.error(result.split('\n')[0]);
          return result;
        }
      },
    }),

    wait: tool({
      description:
        'Wait for a specified number of minutes. Use this when construction or research is in progress and you need to wait for it to complete. The game runs in real time.',
      inputSchema: z.object({
        minutes: z
          .number()
          .min(0.1)
          .max(60)
          .describe('Number of minutes to wait'),
        reason: z.string().describe('Why you are waiting'),
      }),
      execute: async ({ minutes, reason }) => {
        log.wait(minutes, reason);
        const ms = Math.min(minutes, 60) * 60 * 1000;
        await new Promise((resolve) => setTimeout(resolve, ms));
        log.waitDone();
        return `Waited ${minutes} minute(s) (${reason}). Check your status with "terminus status".`;
      },
    }),

    done: tool({
      description:
        'Signal that you are finished playing. Call this when you have built a stable empire or exhausted your options for now.',
      inputSchema: z.object({
        reason: z.string().describe('Why you are stopping'),
      }),
    }),
  };
}
