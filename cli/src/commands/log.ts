import { Command } from 'commander';
import { get, post } from '../api';

export function registerLogCommands(program: Command) {
  const log = program
    .command('log')
    .description("Captain's log -- record notes, strategies, and observations");

  log
    .command('add <content>')
    .description('Record a new log entry')
    .option('--tag <tag>', 'Tag the entry for filtering')
    .addHelpText('after', `
Examples:
  terminus log add "Claimed planet Kepler. Rich in minerals."
  terminus log add "Enemy spotted near Sol system" --tag recon
  terminus log add "Building 3 mines before shipyard" --tag strategy`)
    .action(async (content: string, opts) => {
      const tags = opts.tag ? [opts.tag] : [];
      const data = await post('/log', { content, tags });
      console.log(data.message);
    });

  log
    .command('list')
    .description('View log entries')
    .option('--tag <tag>', 'Filter by tag')
    .option('--search <term>', 'Search log content')
    .option('--limit <n>', 'Number of entries', '10')
    .option('--page <n>', 'Page number', '1')
    .addHelpText('after', `
Examples:
  terminus log list
  terminus log list --tag strategy
  terminus log list --search "minerals"
  terminus log list --limit 20 --page 2`)
    .action(async (opts) => {
      const params: Record<string, string> = {};
      if (opts.tag) params.tag = opts.tag;
      if (opts.search) params.search = opts.search;
      params.limit = opts.limit;
      params.page = opts.page;

      const data = await get('/log', params);

      if (data.entries.length === 0) {
        console.log('No log entries found.');
        return;
      }

      for (const entry of data.entries) {
        const date = new Date(entry.createdAt).toLocaleString();
        const tags = entry.tags.length > 0 ? ` [${entry.tags.join(', ')}]` : '';
        console.log(`[${date}]${tags}`);
        console.log(`  ${entry.content}`);
        console.log();
      }

      console.log(`Page ${data.page} (${data.entries.length} of ${data.total} total)`);
    });
}
