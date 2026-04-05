import type { Command } from 'commander';
import { post } from '../api';
import { STRUCTURE_DEFINITIONS } from '@terminus/shared';
import type { StructureType } from '@terminus/shared';
import { formatCompletesAt } from '../format';

export function registerBuildCommands(program: Command) {
  const validTypes = Object.keys(STRUCTURE_DEFINITIONS).join(', ');

  program
    .command('build <body-id> <type>')
    .description(`Build a structure on an owned body. Types: ${validTypes}`)
    .addHelpText(
      'after',
      `
Structure types:
  mine          100 minerals, +10 minerals/hr, 5 min build
  power_plant   100 minerals, +10 energy/hr, 5 min build
  refinery      200 minerals + 50 energy, +5 alloys/hr, 15 min (requires Basic Industry)
  research_lab  200 minerals + 100 energy, enables research, 15 min

Examples:
  terminus build abc-123 mine
  terminus build abc-123 power_plant
  terminus build abc-123 research_lab`,
    )
    .action(async (bodyId: string, type: string) => {
      if (!STRUCTURE_DEFINITIONS[type as StructureType]) {
        console.error(`Invalid structure type: ${type}`);
        console.error(`Valid types: ${validTypes}`);
        process.exit(1);
      }

      const data = await post(`/bodies/${bodyId}/build`, { type });
      console.log(data.message);
      console.log(`  Completes at: ${formatCompletesAt(data.structure.completesAt)}`);
    });
}
