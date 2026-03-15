import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { listBuilds } from '../../api/builds.js';
import { getConfig } from '../../config/index.js';
import { outputTable, outputJson, relativeDate, truncate } from '../../output/index.js';

// BuildStatus enum values: 1=inProgress, 2=completed, 32=notStarted
const STATUS_MAP: Record<string, number> = {
  queued: 32,
  in_progress: 1,
  completed: 2,
};

async function runListHandler(options: {
  limit?: string;
  status?: string;
  branch?: string;
  project?: string;
  org?: string;
  json?: string | boolean;
  web?: boolean;
}): Promise<void> {
  const config = getConfig({ orgUrl: options.org, project: options.project });

  if (options.web) {
    const url = `${config.orgUrl}/${encodeURIComponent(config.project)}/_build`;
    const openMod = await import('open');
    await openMod.default(url);
    return;
  }

  const connection = await getWebApi(config.orgUrl);
  const statusFilter = options.status ? STATUS_MAP[options.status.toLowerCase()] : undefined;

  const builds = await listBuilds(connection, config.project, {
    limit: options.limit ? parseInt(options.limit, 10) : 30,
    statusFilter,
    branch: options.branch,
  });

  if (options.json !== undefined) {
    outputJson(builds, typeof options.json === 'string' ? options.json : undefined);
    return;
  }

  if (builds.length === 0) {
    process.stdout.write('No pipeline runs found.\n');
    return;
  }

  outputTable(
    ['ID', 'PIPELINE', 'STATUS', 'RESULT', 'BRANCH', 'STARTED'],
    builds.map((b) => [
      String(b.id),
      truncate(b.pipelineName, 30),
      b.status,
      b.result,
      truncate(b.branch, 30),
      relativeDate(b.startTime),
    ]),
  );
}

export function registerRunList(runCmd: Command): void {
  runCmd
    .command('list')
    .description('List recent pipeline runs')
    .option('--limit <number>', 'Max runs to return', '30')
    .option('--status <status>', 'Filter by status: queued|in_progress|completed')
    .option('--branch <branch>', 'Filter by branch name')
    .option('-w, --web', 'Open in browser')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(runListHandler);
}
