import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getWorkItem } from '../../api/workItems.js';
import { getConfig } from '../../config/index.js';
import { AdoError } from '../../errors/index.js';

function sanitizeBranchName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function issueDevelopHandler(
  id: string,
  options: {
    branch?: string;
    base?: string;
    repo?: string;
    project?: string;
    org?: string;
  }
): Promise<void> {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    process.stderr.write(`ado: invalid work item ID: ${id}\n`);
    process.exit(1);
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const gitApi = await connection.getGitApi();

  // Resolve repo
  let repoName = options.repo;
  if (!repoName) {
    const repos = await gitApi.getRepositories(config.project);
    if (!repos || repos.length === 0) {
      throw new AdoError(`No repositories found in project '${config.project}'.`);
    }
    if (repos.length === 1) {
      repoName = repos[0].name!;
    } else {
      throw new AdoError(
        `Multiple repositories found. Specify one with --repo:\n` +
          repos.map((r) => `  ${r.name}`).join('\n'),
      );
    }
  }

  // Get work item title for branch name
  const { item } = await getWorkItem(connection, config.project, numId);
  const branchName =
    options.branch ?? `workitem/${numId}-${sanitizeBranchName(item.title)}`;

  // Resolve base branch (try main then master)
  const baseBranch = options.base ?? 'main';
  let baseSha: string | undefined;
  try {
    const branchInfo = await gitApi.getBranch(repoName, baseBranch, config.project);
    baseSha = branchInfo.commit?.commitId;
  } catch {
    if (!options.base) {
      // Try master as fallback
      try {
        const branchInfo = await gitApi.getBranch(repoName, 'master', config.project);
        baseSha = branchInfo.commit?.commitId;
      } catch {
        throw new AdoError(`Base branch 'main' or 'master' not found. Specify one with --base.`);
      }
    } else {
      throw new AdoError(`Base branch '${baseBranch}' not found.`);
    }
  }

  if (!baseSha) {
    throw new AdoError(`Could not resolve commit for base branch.`);
  }

  // Create the branch
  await gitApi.updateRefs(
    [
      {
        name: `refs/heads/${branchName}`,
        newObjectId: baseSha,
        oldObjectId: '0000000000000000000000000000000000000000',
      },
    ],
    repoName,
    config.project,
  );

  // Link branch to work item via VSTFS artifact URI
  const repoInfo = await gitApi.getRepository(repoName, config.project);
  const projectId = repoInfo.project?.id;
  const repoId = repoInfo.id;

  if (projectId && repoId) {
    const vstfsUri = `vstfs:///Git/Ref/${projectId}%2F${repoId}%2FGB${encodeURIComponent(branchName)}`;
    const witApi = await connection.getWorkItemTrackingApi();
    try {
      await witApi.updateWorkItem(
        {} as Record<string, string>,
        [
          {
            op: 'add' as const,
            path: '/relations/-',
            value: {
              rel: 'ArtifactLink',
              url: vstfsUri,
              attributes: { comment: '', name: 'Branch' },
            },
          },
        ],
        numId,
        config.project,
      );
    } catch {
      // Non-fatal: branch was created, link failed
      process.stderr.write(`Warning: branch created but could not link to work item #${numId}\n`);
    }
  }

  process.stdout.write(`Branch '${branchName}' created and linked to work item #${numId}\n`);
}

export function registerIssueDevelop(issueCmd: Command): void {
  issueCmd
    .command('develop <id>')
    .description('Create a branch linked to a work item')
    .option('-b, --branch <name>', 'Branch name (default: workitem/<id>-<title-slug>)')
    .option('--base <branch>', 'Base branch to branch from (default: main or master)')
    .option('-r, --repo <repo>', 'Repository name')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(issueDevelopHandler);
}
