import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { patchWorkItem } from '../../api/workItems.js';
import { getConfig } from '../../config/index.js';
import { AzdError } from '../../errors/index.js';
import { outputJson } from '../../output/index.js';

async function issueEditHandler(
  id: string,
  options: {
    title?: string;
    body?: string;
    state?: string;
    assignee?: string;
    label?: string;
    project?: string;
    org?: string;
    json?: string | boolean;
  }
): Promise<void> {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    process.stderr.write(`azd: invalid work item ID: ${id}\n`);
    process.exit(1);
  }

  const fields: Record<string, string> = {};
  if (options.title) fields['System.Title'] = options.title;
  if (options.body !== undefined) fields['System.Description'] = options.body;
  if (options.state) fields['System.State'] = options.state;
  if (options.assignee !== undefined) fields['System.AssignedTo'] = options.assignee;
  if (options.label !== undefined) fields['System.Tags'] = options.label;

  if (Object.keys(fields).length === 0) {
    throw new AzdError('No fields to update. Specify at least one of: --title, --body, --state, --assignee, --label');
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const item = await patchWorkItem(connection, config.project, numId, fields);

  if (options.json !== undefined) {
    outputJson(item, typeof options.json === 'string' ? options.json : undefined);
    return;
  }

  process.stdout.write(`Updated work item #${item.id}\n`);
}

export function registerIssueEdit(issueCmd: Command): void {
  issueCmd
    .command('edit <id>')
    .description('Edit a work item')
    .option('-t, --title <title>', 'New title')
    .option('-b, --body <text>', 'New description')
    .option('-s, --state <state>', 'New state (Active, Closed, Resolved, …)')
    .option('-a, --assignee <assignee>', 'Assign to user (display name or email; empty string to unassign)')
    .option('-l, --label <tags>', 'Semi-colon separated tags')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(issueEditHandler);
}
