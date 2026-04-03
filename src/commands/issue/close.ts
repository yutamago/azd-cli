import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { patchWorkItem } from '../../api/workItems.js';
import { getConfig } from '../../config/index.js';

async function issueCloseHandler(
  id: string,
  options: { project?: string; org?: string }
): Promise<void> {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    process.stderr.write(`ado: invalid work item ID: ${id}\n`);
    process.exit(1);
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  await patchWorkItem(connection, config.project, numId, { 'System.State': 'Closed' });
  process.stdout.write(`Closed work item #${numId}\n`);
}

export function registerIssueClose(issueCmd: Command): void {
  issueCmd
    .command('close <id>')
    .description('Close a work item (set state to Closed)')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(issueCloseHandler);
}
