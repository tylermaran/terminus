import { Command } from 'commander';
import { get, post } from '../api';

export function registerBodyCommands(program: Command) {
  program
    .command('body <id>')
    .description('View detailed information about a celestial body')
    .addHelpText('after', `
Examples:
  terminus body abc-123-def`)
    .action(async (id: string) => {
      const b = await get(`/bodies/${id}`);

      console.log(`${b.name} (${b.type})`);
      console.log(`  Coordinates: (${b.x}, ${b.y}, ${b.z})`);
      console.log(`  Radius: ${b.radius}`);
      console.log(`  Resource Richness: ${b.resourceRichness}`);
      console.log(`  Owner: ${b.owner || 'Unclaimed'}`);

      if (b.structures && b.structures.length > 0) {
        console.log(`\nStructures:`);
        for (const s of b.structures) {
          const status = s.operational ? 'operational' : `building (ready ${new Date(s.completesAt).toLocaleString()})`;
          console.log(`  - ${s.type} [${status}]`);
        }
      }

      if (b.resources) {
        console.log(`\nResources:`);
        console.log(`  Minerals: ${b.resources.minerals}`);
        console.log(`  Energy: ${b.resources.energy}`);
        console.log(`  Alloys: ${b.resources.alloys}`);
        console.log(`  Credits: ${b.resources.credits}`);
        console.log(`  Research Points: ${b.resources.researchPoints}`);
      }
    });

  program
    .command('claim <body-id>')
    .description('Claim an unowned celestial body')
    .addHelpText('after', `
Examples:
  terminus claim abc-123-def    # Claim a planet or asteroid`)
    .action(async (bodyId: string) => {
      const data = await post(`/bodies/${bodyId}/claim`);
      console.log(data.message);
      if (data.resources) {
        const r = data.resources;
        if (r.minerals > 0 || r.energy > 0) {
          console.log(`  Starting resources: ${r.minerals} minerals, ${r.energy} energy`);
        }
      }
    });
}
