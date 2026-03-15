import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getBuild } from '../../api/builds.js';
import { getConfig } from '../../config/index.js';
import { isTTY } from '../../output/index.js';

const POLL_INTERVAL_MS = 3000;
const COMPLETED_STATUS = 'completed';

async function runWatchHandler(
  runId: string,
  options: { project?: string; org?: string }
): Promise<void> {
  const numId = parseInt(runId, 10);
  if (isNaN(numId)) {
    process.stderr.write(`azd: invalid run ID: ${runId}\n`);
    process.exit(1);
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);

  process.stdout.write(`Watching run #${numId}...\n`);

  let lastStatus = '';
  while (true) {
    const build = await getBuild(connection, config.project, numId);
    const statusLine = build.result
      ? `${build.status}: ${build.result}`
      : build.status;

    if (statusLine !== lastStatus) {
      if (isTTY) {
        process.stdout.write(`\r${statusLine}               `);
      } else {
        process.stdout.write(statusLine + '\n');
      }
      lastStatus = statusLine;
    }

    if (build.status === COMPLETED_STATUS) {
      if (isTTY) process.stdout.write('\n');
      process.stdout.write(`Run #${numId} completed: ${build.result || 'unknown'}\n`);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

export function registerRunWatch(runCmd: Command): void {
  runCmd
    .command('watch <run-id>')
    .description('Watch a pipeline run until it completes')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(runWatchHandler);
}
