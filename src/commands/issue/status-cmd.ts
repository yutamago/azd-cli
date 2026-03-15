import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getConfig } from '../../config/index.js';
import { outputTable, outputJson, relativeDate, colorState, truncate } from '../../output/index.js';
import { handleApiError } from '../../errors/index.js';
import * as azdev from 'azure-devops-node-api';

async function fetchSection(
  witApi: Awaited<ReturnType<azdev.WebApi['getWorkItemTrackingApi']>>,
  project: string,
  condition: string,
  limit = 10
) {
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}' AND ${condition} AND [System.State] <> 'Closed' ORDER BY [System.ChangedDate] DESC`,
  };
  try {
    const result = await witApi.queryByWiql(wiql, { project }, undefined, limit);
    const ids = (result.workItems ?? []).slice(0, limit).map((wi) => wi.id!).filter(Boolean);
    if (ids.length === 0) return [];
    return await witApi.getWorkItemsBatch({
      ids,
      fields: ['System.Id', 'System.WorkItemType', 'System.Title', 'System.State', 'System.AssignedTo', 'System.ChangedDate'],
    });
  } catch {
    return [];
  }
}

async function issueStatusHandler(options: {
  project?: string;
  org?: string;
  json?: string | boolean;
}): Promise<void> {
  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const witApi = await connection.getWorkItemTrackingApi();

  const [assignedItems, createdItems] = await Promise.all([
    fetchSection(witApi, config.project, `[System.AssignedTo] = @Me`),
    fetchSection(witApi, config.project, `[System.CreatedBy] = @Me`),
  ]);

  const toRow = (wi: NonNullable<typeof assignedItems>[number]) => {
    const f = wi.fields ?? {};
    return {
      id: wi.id ?? 0,
      type: String(f['System.WorkItemType'] ?? ''),
      title: String(f['System.Title'] ?? ''),
      state: String(f['System.State'] ?? ''),
      updatedAt: String(f['System.ChangedDate'] ?? ''),
    };
  };

  if (options.json !== undefined) {
    outputJson(
      { assigned: assignedItems.map(toRow), created: createdItems.map(toRow) },
      typeof options.json === 'string' ? options.json : undefined,
    );
    return;
  }

  const printSection = (title: string, items: typeof assignedItems) => {
    process.stdout.write(`\n${title}\n`);
    if (!items || items.length === 0) {
      process.stdout.write('  (none)\n');
      return;
    }
    outputTable(
      ['ID', 'TYPE', 'TITLE', 'STATE', 'UPDATED'],
      items.map((wi) => {
        const f = wi.fields ?? {};
        return [
          String(wi.id ?? ''),
          String(f['System.WorkItemType'] ?? ''),
          truncate(String(f['System.Title'] ?? ''), 55),
          colorState(String(f['System.State'] ?? '')),
          relativeDate(String(f['System.ChangedDate'] ?? '')),
        ];
      }),
    );
  };

  printSection('Issues assigned to you', assignedItems);
  printSection('Issues created by you', createdItems);
}

export function registerIssueStatus(issueCmd: Command): void {
  issueCmd
    .command('status')
    .description('Show work items assigned to or created by you')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(issueStatusHandler);
}
