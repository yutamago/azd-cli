import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { createWorkItem } from '../../api/workItems.js';
import { getConfig } from '../../config/index.js';
import { AzdError } from '../../errors/index.js';
import { outputJson } from '../../output/index.js';

async function issueCreateHandler(options: {
  title?: string;
  type?: string;
  body?: string;
  assignee?: string;
  label?: string;
  project?: string;
  org?: string;
  json?: string | boolean;
}): Promise<void> {
  if (!options.title) {
    throw new AzdError('Title is required. Use -t/--title <title>');
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);

  const item = await createWorkItem(connection, config.project, options.type ?? 'Issue', {
    title: options.title,
    description: options.body,
    assignee: options.assignee,
    tags: options.label,
  });

  if (options.json !== undefined) {
    outputJson(item, typeof options.json === 'string' ? options.json : undefined);
    return;
  }

  process.stdout.write(`Created ${item.type} #${item.id}: ${item.title}\n${item.url}\n`);
}

export function registerIssueCreate(issueCmd: Command): void {
  issueCmd
    .command('create')
    .description('Create a new work item')
    .requiredOption('-t, --title <title>', 'Work item title')
    .option('--type <type>', 'Work item type (Bug, Task, User Story, Issue, …)', 'Issue')
    .option('-b, --body <text>', 'Work item description')
    .option('-a, --assignee <assignee>', 'Assign to user (display name or email)')
    .option('-l, --label <tags>', 'Semi-colon separated tags')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(issueCreateHandler);
}
