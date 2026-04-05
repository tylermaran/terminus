import { generateText, hasToolCall, stepCountIs, type ModelMessage, type LanguageModel } from 'ai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { createTools } from './tools';
import { createLogger } from './log';

const SKILL_PATH = path.resolve(__dirname, '../../cli/assets/SKILL.md');
const MAX_TURNS = 50;
const STEPS_PER_TURN = 15;

function loadSkill(): string {
  return fs.readFileSync(SKILL_PATH, 'utf-8').replace(/^---[\s\S]*?---\n*/, '');
}

function buildSystemPrompt(username: string): string {
  const skill = loadSkill();
  return `You are ${username}, an autonomous AI agent playing Terminus — a real-time space conquest game.

You have already been registered and assigned a homeworld. Start building your empire.

## Rules
- Use the "terminus" tool to run game commands. Pass only the arguments (e.g. "status", "scan --type planet").
- Do NOT include "terminus" in the args — just the subcommand and flags.
- Use the "wait" tool when you need to wait for construction or research to finish.
- Use the "done" tool when you have built a stable empire or run out of productive actions.
- Log your reasoning after every major decision with: terminus log add "<reason>" --tag strategy
- Be strategic and efficient. Minimize wasted turns.

## Game Reference
${skill}`;
}

async function registerPlayer(
  username: string,
  serverUrl: string,
): Promise<{ apiKey: string; homeworld: string }> {
  const resp = await axios.post(`${serverUrl}/auth/register`, { username });
  return {
    apiKey: resp.data.apiKey,
    homeworld: resp.data.homeworld?.name || 'unknown',
  };
}

export interface AgentResult {
  username: string;
  turns: number;
  reason: string;
  error?: string;
}

export async function runAgent(
  username: string,
  serverUrl: string,
  model: LanguageModel,
  agentIndex: number,
): Promise<AgentResult> {
  const log = createLogger(username, agentIndex);
  log.info('Registering...');

  const { apiKey, homeworld } = await registerPlayer(username, serverUrl);
  log.info(`Registered. Homeworld: ${homeworld}`);

  const tools = createTools(apiKey, serverUrl, log);
  const systemPrompt = buildSystemPrompt(username);

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You just registered as ${username} and were assigned homeworld "${homeworld}". Start building your empire. Begin by checking your status, then make a plan.`,
        },
      ],
    },
  ];

  let turns = 0;
  let doneReason = '';

  while (turns < MAX_TURNS) {
    turns++;
    log.turn(turns);

    try {
      log.thinking();
      const result = await generateText({
        model,
        messages,
        tools,
        stopWhen: [stepCountIs(STEPS_PER_TURN), hasToolCall('done')],
      });

      const stepCount = result.steps.length;
      const toolCallCount = result.steps.reduce((n, s) => n + s.toolCalls.length, 0);
      log.steps(stepCount, toolCallCount);

      messages.push(...(result.response.messages as ModelMessage[]));

      const doneCall = result.steps
        .flatMap((s) => s.toolCalls)
        .find((tc) => tc.toolName === 'done');

      if (doneCall) {
        const callArgs = 'args' in doneCall ? doneCall.args : {};
        doneReason = (callArgs as { reason: string }).reason;
        log.done(doneReason);
        break;
      }

      if (result.text) {
        log.speech(result.text);
      }

      messages.push({
        role: 'user',
        content: [{ type: 'text', text: 'Continue playing. What is your next move?' }],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Turn ${turns} failed: ${msg}`);
      return { username, turns, reason: 'error', error: msg };
    }
  }

  if (!doneReason) {
    doneReason = `Reached max turns (${MAX_TURNS})`;
    log.info(doneReason);
  }

  return { username, turns, reason: doneReason };
}
