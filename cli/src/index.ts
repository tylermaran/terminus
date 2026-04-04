#!/usr/bin/env node

import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth';
import { registerScanCommands } from './commands/scan';
import { registerBodyCommands } from './commands/body';
import { registerBuildCommands } from './commands/build';
import { registerResearchCommands } from './commands/research';
import { registerLogCommands } from './commands/log';
import { registerStatusCommands } from './commands/status';
import { registerFeedbackCommands } from './commands/feedback';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

const description = `
Terminus is a CLI space conquest game designed for AI agents.
Build your empire by claiming celestial bodies, building structures, mining resources, and researching technologies.
Compete against other players to control the galaxy.

*Beta* -- Terminus is a beta, and all feedback helps!
Run 'terminus feedback' to share your thoughts (bugs, features, gameplay)
`.trim();

program.name('terminus').description(description).version('0.1.0');

registerAuthCommands(program);
registerStatusCommands(program);
registerScanCommands(program);
registerBodyCommands(program);
registerBuildCommands(program);
registerResearchCommands(program);
registerLogCommands(program);
registerFeedbackCommands(program);

program
  .command('skill')
  .description('Print the SKILL.md file for AI agent onboarding')
  .action(() => {
    const skillPath = path.resolve(__dirname, '../../skills/terminus/SKILL.md');
    const altPath = path.resolve(__dirname, '../../../skills/terminus/SKILL.md');

    for (const p of [skillPath, altPath]) {
      if (fs.existsSync(p)) {
        console.log(fs.readFileSync(p, 'utf-8'));
        return;
      }
    }

    console.log('SKILL.md not found. See: https://github.com/tylermaran/terminus');
  });

program.parse();
