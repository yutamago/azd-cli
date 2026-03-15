import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getOrgUrl } from '../../config/index.js';
import { outputTable, outputJson, relativeDate, truncate } from '../../output/index.js';

async function searchProjectsHandler(
  query: string | undefined,
  options: { limit?: string; org?: string; json?: string | boolean }
): Promise<void> {
  const orgUrl = getOrgUrl(options.org);
  const connection = await getWebApi(orgUrl);
  const coreApi = await connection.getCoreApi();
  const projects = await coreApi.getProjects();

  let results = projects ?? [];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
    );
  }

  const limit = parseInt(options.limit ?? '30', 10);
  results = results.slice(0, limit);

  if (options.json !== undefined) {
    outputJson(
      results.map((p) => ({
        id: p.id,
        name: p.name,
        state: p.state,
        visibility: p.visibility,
        description: p.description,
        lastUpdateTime: p.lastUpdateTime,
      })),
      typeof options.json === 'string' ? options.json : undefined,
    );
    return;
  }

  if (results.length === 0) {
    process.stdout.write('No projects found.\n');
    return;
  }

  outputTable(
    ['NAME', 'STATE', 'VISIBILITY', 'DESCRIPTION', 'LAST UPDATED'],
    results.map((p) => [
      p.name ?? '',
      String(p.state ?? ''),
      String(p.visibility ?? ''),
      truncate(p.description ?? '', 40),
      relativeDate(p.lastUpdateTime as unknown as string),
    ]),
  );
}

export function registerSearchProjects(searchCmd: Command): void {
  searchCmd
    .command('projects [query]')
    .description('Search Azure DevOps projects')
    .option('--limit <number>', 'Max results', '30')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(searchProjectsHandler);
}
