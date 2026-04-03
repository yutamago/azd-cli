import * as readline from 'readline';
import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getConfig } from '../../config/index.js';
import { handleApiError } from '../../errors/index.js';
import { isTTY } from '../../output/index.js';

function confirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function runDeleteHandler(
  runId: string,
  options: { yes?: boolean; project?: string; org?: string }
): Promise<void> {
  const numId = parseInt(runId, 10);
  if (isNaN(numId)) {
    process.stderr.write(`ado: invalid run ID: ${runId}\n`);
    process.exit(1);
  }

  if (!options.yes && isTTY) {
    const ok = await confirm(`Are you sure you want to delete run #${numId}? [y/N] `);
    if (!ok) {
      process.stdout.write('Aborted.\n');
      return;
    }
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const buildApi = await connection.getBuildApi();

  try {
    await buildApi.deleteBuild(config.project, numId);
    process.stdout.write(`Run #${numId} deleted.\n`);
  } catch (err) {
    handleApiError(err, `Run #${numId}`);
  }
}

export function registerRunDelete(runCmd: Command): void {
  runCmd
    .command('delete <run-id>')
    .description('Delete a pipeline run record')
    .option('--yes', 'Skip confirmation prompt')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(runDeleteHandler);
}
