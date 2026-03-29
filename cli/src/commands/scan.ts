import { Command } from 'commander';
import { get } from '../api';

export function registerScanCommands(program: Command) {
  program
    .command('scan')
    .description('Browse celestial bodies in the galaxy')
    .option('--type <type>', 'Filter by body type (star, planet, moon, asteroid)')
    .option('--sort <field>', 'Sort by: distance, richness')
    .option('--page <n>', 'Page number', '1')
    .option('--limit <n>', 'Results per page', '20')
    .addHelpText('after', `
Examples:
  terminus scan                          # List all nearby bodies
  terminus scan --type planet            # Only planets
  terminus scan --type asteroid --sort richness  # Richest asteroids
  terminus scan --page 2 --limit 10      # Paginate results`)
    .action(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.type) params.type = opts.type;
      if (opts.sort) params.sort = opts.sort;
      params.page = opts.page;
      params.limit = opts.limit;

      const data = await get('/bodies', params);
      const bodies = data.bodies;

      if (bodies.length === 0) {
        console.log('No bodies found matching your criteria.');
        return;
      }

      const header = `${'ID'.padEnd(38)} ${'Name'.padEnd(20)} ${'Type'.padEnd(10)} ${'Radius'.padEnd(8)} ${'Rich.'.padEnd(7)} ${'Owner'.padEnd(16)} ${'Dist.'.padEnd(8)}`;
      console.log(header);
      console.log('-'.repeat(header.length));

      for (const b of bodies) {
        const id = b.id.substring(0, 36).padEnd(38);
        const name = (b.name || '').substring(0, 18).padEnd(20);
        const type = b.type.padEnd(10);
        const radius = String(b.radius).padEnd(8);
        const richness = String(b.resourceRichness).padEnd(7);
        const owner = (b.owner || '-').substring(0, 14).padEnd(16);
        const dist = b.distance != null ? String(b.distance) : '-';
        console.log(`${id} ${name} ${type} ${radius} ${richness} ${owner} ${dist}`);
      }

      console.log(`\nPage ${data.page} (${bodies.length} of ${data.total} total)`);
    });
}
