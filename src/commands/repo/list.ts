import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getConfig } from '../../config/index.js';
import { outputTable, outputJson } from '../../output/index.js';

async function repoListHandler(options: {
  limit?: string;
  project?: string;
  org?: string;
  json?: string | boolean;
}): Promise<void> {
  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const gitApi = await connection.getGitApi();
  const repos = await gitApi.getRepositories(config.project);

  const limit = parseInt(options.limit ?? '30', 10);
  const results = (repos ?? []).slice(0, limit);

  if (options.json !== undefined) {
    outputJson(
      results.map((r) => ({
        id: r.id,
        name: r.name,
        defaultBranch: (r.defaultBranch ?? '').replace('refs/heads/', ''),
        remoteUrl: r.remoteUrl,
        sshUrl: r.sshUrl,
        size: r.size,
      })),
      typeof options.json === 'string' ? options.json : undefined,
    );
    return;
  }

  if (results.length === 0) {
    process.stdout.write('No repositories found.\n');
    return;
  }

  outputTable(
    ['NAME', 'DEFAULT BRANCH', 'REMOTE URL'],
    results.map((r) => [
      r.name ?? '',
      (r.defaultBranch ?? '').replace('refs/heads/', ''),
      r.remoteUrl ?? '',
    ]),
  );
}

export function registerRepoList(repoCmd: Command): void {
  repoCmd
    .command('list')
    .description('List repositories in a project')
    .option('--limit <number>', 'Max results', '30')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(repoListHandler);
}
