import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getConfig } from '../../config/index.js';
import { handleApiError } from '../../errors/index.js';

async function runRerunHandler(
  runId: string,
  options: { project?: string; org?: string }
): Promise<void> {
  const numId = parseInt(runId, 10);
  if (isNaN(numId)) {
    process.stderr.write(`ado: invalid run ID: ${runId}\n`);
    process.exit(1);
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const buildApi = await connection.getBuildApi();

  try {
    await buildApi.updateBuild({} as never, config.project, numId, true);
    process.stdout.write(`Run #${numId} has been requeued.\n`);
  } catch (err) {
    handleApiError(err, `Run #${numId}`);
  }
}

export function registerRunRerun(runCmd: Command): void {
  runCmd
    .command('rerun <run-id>')
    .description('Re-queue a completed or failed pipeline run')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(runRerunHandler);
}
