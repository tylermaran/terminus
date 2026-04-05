import * as path from 'path';
import dotenv from 'dotenv';
import { createProviderRegistry } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { runAgent } from './agent';
import type { AgentResult } from './agent';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NPC_NAMES = [
  'npc-alpha',
  'npc-bravo',
  'npc-charlie',
  'npc-delta',
  'npc-echo',
  'npc-foxtrot',
  'npc-golf',
  'npc-hotel',
  'npc-india',
  'npc-juliet',
];

function parseArgs() {
  const args = process.argv.slice(2);
  let agents = 2;
  let modelId = 'openai:gpt-4o-mini';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agents' && args[i + 1]) {
      agents = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--model' && args[i + 1]) {
      modelId = args[i + 1];
      i++;
    }
  }

  return { agents: Math.min(agents, NPC_NAMES.length), modelId };
}

async function main() {
  const { agents: agentCount, modelId } = parseArgs();
  const serverUrl = process.env.TERMINUS_SERVER_URL || 'http://localhost:3333';

  const registry = createProviderRegistry({
    openai: createOpenAI(),
    anthropic: createAnthropic(),
  });

  let model;
  try {
    model = registry.languageModel(modelId as `openai:${string}` | `anthropic:${string}`);
  } catch {
    console.error(`Failed to create model "${modelId}". Make sure the provider API key is set.`);
    console.error('Examples: openai:gpt-4o-mini, anthropic:claude-sonnet-4-20250514');
    process.exit(1);
  }

  const suffix = Date.now().toString(36).slice(-4);
  const names = NPC_NAMES.slice(0, agentCount).map((n) => `${n}-${suffix}`);

  console.log(`\n=== Terminus NPC Simulator ===`);
  console.log(`Agents:  ${agentCount}`);
  console.log(`Model:   ${modelId}`);
  console.log(`Server:  ${serverUrl}`);
  console.log(`Players: ${names.join(', ')}`);
  console.log(`=============================\n`);

  const results = await Promise.allSettled(
    names.map((name, i) => runAgent(name, serverUrl, model, i)),
  );

  console.log(`\n\x1b[1m=== Simulation Complete ===\x1b[0m\n`);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const r: AgentResult = result.value;
      const icon = r.error ? '\x1b[31m✗\x1b[0m' : '\x1b[32m✓\x1b[0m';
      console.log(`  ${icon} ${r.username}: ${r.turns} turns — ${r.reason}`);
    } else {
      console.log(`  \x1b[31m✗\x1b[0m FAILED: ${result.reason}`);
    }
  }

  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
