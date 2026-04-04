import type { Command } from 'commander';
import { get, post } from '../api';

export function registerResearchCommands(program: Command) {
  const research = program.command('research').description('Manage technology research');

  research
    .command('list')
    .description('List all technologies and their research status')
    .addHelpText(
      'after',
      `
Examples:
  terminus research list`,
    )
    .action(async () => {
      const data = await get('/research');

      if (data.technologies.length === 0) {
        console.log('No technologies available.');
        return;
      }

      const statusIcon: Record<string, string> = {
        completed: '[DONE]',
        in_progress: '[IN PROGRESS]',
        available: '[AVAILABLE]',
        locked: '[LOCKED]',
      };

      for (const tech of data.technologies) {
        const icon = statusIcon[tech.status] || tech.status;
        console.log(`${icon} ${tech.name} (${tech.id})`);
        console.log(`    ${tech.description}`);
        console.log(
          `    Cost: ${tech.cost} research pts | Duration: ${Math.round(tech.durationSeconds / 60)} min`,
        );
        if (tech.prerequisiteName) console.log(`    Requires: ${tech.prerequisiteName}`);
        if (tech.completesAt)
          console.log(`    Completes: ${new Date(tech.completesAt).toLocaleString()}`);
        console.log();
      }
    });

  research
    .command('start <tech-id>')
    .description('Begin researching a technology')
    .addHelpText(
      'after',
      `
Examples:
  terminus research start basic_industry
  terminus research start energy_efficiency`,
    )
    .action(async (techId: string) => {
      const data = await post(`/research/${techId}`);
      console.log(data.message);
      console.log(`  Completes at: ${new Date(data.research.completesAt).toLocaleString()}`);
    });
}
