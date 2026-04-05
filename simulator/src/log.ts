const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const AGENT_COLORS = [COLORS.cyan, COLORS.magenta, COLORS.green, COLORS.yellow, COLORS.blue];

function c(color: string, text: string): string {
  return `${color}${text}${COLORS.reset}`;
}

export function createLogger(username: string, agentIndex: number) {
  const agentColor = AGENT_COLORS[agentIndex % AGENT_COLORS.length];
  const tag = c(agentColor + COLORS.bold, `[${username}]`);

  return {
    info: (msg: string) => console.log(`${tag} ${msg}`),
    turn: (n: number) => console.log(`${tag} ${c(COLORS.bold, `── Turn ${n} ──`)}`),
    thinking: () => console.log(`${tag}   ${c(COLORS.gray, '⟳ thinking...')}`),
    steps: (steps: number, tools: number) =>
      console.log(`${tag}   ${c(COLORS.gray, `${steps} step(s), ${tools} tool call(s)`)}`),
    cmd: (args: string) => console.log(`${tag}   ${c(COLORS.blue, `▶ terminus ${args}`)}`),
    result: (line: string) => console.log(`${tag}   ${c(COLORS.dim, `  ${line}`)}`),
    error: (msg: string) => console.log(`${tag}   ${c(COLORS.red, `✗ ${msg}`)}`),
    wait: (min: number, reason: string) =>
      console.log(`${tag}   ${c(COLORS.yellow, `⏳ waiting ${min} min`)} ${c(COLORS.gray, `(${reason})`)}`),
    waitDone: () => console.log(`${tag}   ${c(COLORS.yellow, '⏳ wait complete')}`),
    speech: (text: string) => console.log(`${tag}   ${c(COLORS.green, `💬 ${text}`)}`),
    done: (reason: string) => console.log(`${tag} ${c(COLORS.bold + COLORS.green, `✓ Done: ${reason}`)}`),
  };
}

export type Logger = ReturnType<typeof createLogger>;
