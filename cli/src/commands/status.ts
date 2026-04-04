import type { Command } from 'commander';
import { get } from '../api';

export function registerStatusCommands(program: Command) {
  program
    .command('status')
    .description('View your empire overview: bodies, resources, construction, research')
    .addHelpText(
      'after',
      `
Examples:
  terminus status`,
    )
    .action(async () => {
      const data = await get('/status');

      console.log(`=== ${data.username}'s Empire ===\n`);

      console.log('Resources:');
      const r = data.totalResources;
      console.log(
        `  Minerals: ${r.minerals} | Energy: ${r.energy} | Alloys: ${r.alloys} | Credits: ${r.credits} | Research: ${r.researchPoints}`,
      );

      console.log(`\nBodies (${data.bodies.length}):`);
      if (data.bodies.length === 0) {
        console.log('  None -- something went wrong, you should have a homeworld!');
      }
      for (const b of data.bodies) {
        const structs = b.structures.length > 0 ? b.structures.join(', ') : 'empty';
        console.log(`  ${b.name} (${b.type}) -- ${structs}`);
      }

      if (data.activeConstruction.length > 0) {
        console.log(`\nUnder Construction:`);
        for (const c of data.activeConstruction) {
          console.log(
            `  ${c.structureType} on ${c.bodyName} -- ready ${new Date(c.completesAt).toLocaleString()}`,
          );
        }
      }

      if (data.completedResearch.length > 0) {
        console.log(`\nCompleted Research: ${data.completedResearch.join(', ')}`);
      }

      if (data.activeResearch) {
        console.log(
          `\nResearching: ${data.activeResearch.name} -- ready ${new Date(data.activeResearch.completesAt).toLocaleString()}`,
        );
      }

      if (data.recentLogs.length > 0) {
        console.log(`\nRecent Log Entries:`);
        for (const l of data.recentLogs) {
          const date = new Date(l.createdAt).toLocaleString();
          console.log(`  [${date}] ${l.content}`);
        }
      }
    });
}
