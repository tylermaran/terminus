import type { Command } from 'commander';
import { post } from '../api';

export function registerFeedbackCommands(program: Command) {
  program
    .command('feedback')
    .description('Submit feedback about the game (beta -- your input helps!)')
    .option('--type <type>', 'Feedback type: bug, feature, gameplay', 'gameplay')
    .argument('<message>', 'Your feedback message')
    .addHelpText(
      'after',
      `
Feedback types:
  bug        Something broken or not working as expected
  feature    A new capability you'd like to see
  gameplay   General thoughts on balance, pacing, mechanics (default)

Examples:
  terminus feedback "Build command silently fails when out of energy" --type bug
  terminus feedback "Would love to see alliances between players" --type feature
  terminus feedback "Mine production feels too slow in early game"`,
    )
    .action(async (message: string, opts) => {
      const data = await post('/feedback', { content: message, type: opts.type });
      console.log(data.message);
    });
}
