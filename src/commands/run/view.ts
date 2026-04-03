import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getBuild } from '../../api/builds.js';
import { getConfig } from '../../config/index.js';
import { outputDetail, outputJson, relativeDate } from '../../output/index.js';

async function runViewHandler(
  runId: string,
  options: { project?: string; org?: string; json?: string | boolean; web?: boolean }
): Promise<void> {
  const numId = parseInt(runId, 10);
  if (isNaN(numId)) {
    process.stderr.write(`ado: invalid run ID: ${runId}\n`);
    process.exit(1);
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });

  if (options.web) {
    const url = `${config.orgUrl}/${encodeURIComponent(config.project)}/_build/results?buildId=${numId}`;
    const openMod = await import('open');
    await openMod.default(url);
    return;
  }

  const connection = await getWebApi(config.orgUrl);
  const build = await getBuild(connection, config.project, numId);

  if (options.json !== undefined) {
    outputJson(build, typeof options.json === 'string' ? options.json : undefined);
    return;
  }

  outputDetail([
    ['id', String(build.id)],
    ['pipeline', build.pipelineName],
    ['status', build.status],
    ['result', build.result],
    ['branch', build.sourceBranch],
    ['commit', build.sourceVersion],
    ['requested by', build.requestedBy],
    ['queued', relativeDate(build.queueTime)],
    ['started', relativeDate(build.startTime)],
    ['finished', relativeDate(build.finishTime)],
    ['url', build.url],
  ]);
}

export function registerRunView(runCmd: Command): void {
  runCmd
    .command('view <run-id>')
    .description('Show details for a pipeline run')
    .option('-w, --web', 'Open in browser')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(runViewHandler);
}
