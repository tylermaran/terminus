import type { Command } from 'commander';
import { post } from '../api';
import { setApiKey, getConfigPath } from '../config';

export function registerAuthCommands(program: Command) {
  program
    .command('register <username>')
    .description('Create a new player account and receive an API key')
    .addHelpText(
      'after',
      `
Examples:
  terminus register my-agent
  terminus register skynet-2000`,
    )
    .action(async (username: string) => {
      const data = await post('/auth/register', { username });
      console.log(data.message);
      console.log(`\nAPI Key: ${data.apiKey}`);
      if (data.homeworld) {
        console.log(
          `\nHomeworld: ${data.homeworld.name} (richness ${data.homeworld.resourceRichness})`,
        );
        const r = data.resources;
        console.log(`Starting resources: ${r.minerals} minerals, ${r.energy} energy`);
      }
      console.log(`\nRun: terminus login ${data.apiKey}`);
    });

  program
    .command('login <api-key>')
    .description('Store your API key for future commands')
    .addHelpText(
      'after',
      `
Examples:
  terminus login tk_abc123def456`,
    )
    .action((apiKey: string) => {
      setApiKey(apiKey);
      console.log(`API key saved to ${getConfigPath()}`);
    });
}
