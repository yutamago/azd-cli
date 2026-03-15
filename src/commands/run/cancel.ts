import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getConfig } from '../../config/index.js';
import { handleApiError } from '../../errors/index.js';

async function runCancelHandler(
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
  const buildApi = await connection.getBuildApi();

  try {
    // BuildStatus.Cancelling = 4
    await buildApi.updateBuild({ status: 4 } as never, config.project, numId);
    process.stdout.write(`Run #${numId} cancellation requested.\n`);
  } catch (err) {
    handleApiError(err, `Run #${numId}`);
  }
}

export function registerRunCancel(runCmd: Command): void {
  runCmd
    .command('cancel <run-id>')
    .description('Cancel an in-progress pipeline run')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(runCancelHandler);
}
