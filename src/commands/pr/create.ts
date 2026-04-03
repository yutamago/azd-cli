import * as child_process from 'child_process';
import * as readline from 'readline';
import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { createPullRequest, resolveRepo } from '../../api/pullRequests.js';
import { getConfig } from '../../config/index.js';
import { AdoError } from '../../errors/index.js';

function promptLine(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getCurrentBranch(): string | undefined {
  try {
    return child_process.execSync('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).toString().trim();
  } catch {
    return undefined;
  }
}

function getDefaultBase(): string | undefined {
  try {
    // Try to find default branch from remote
    const output = child_process
      .execSync('git remote show origin', { stdio: 'pipe' })
      .toString();
    const match = output.match(/HEAD branch:\s*(.+)/);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

async function prCreateHandler(options: {
  title?: string;
  body?: string;
  base?: string;
  head?: string;
  repo?: string;
  draft?: boolean;
  reviewer?: string | string[];
  project?: string;
  org?: string;
  json?: string | boolean;
  web?: boolean;
}): Promise<void> {
  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const repoName = await resolveRepo(connection, config.project, options.repo);

  // Resolve head branch
  let head = options.head ?? getCurrentBranch();
  if (!head) {
    if (!process.stdin.isTTY) {
      throw new AdoError('Could not detect current branch. Use --head <branch>.');
    }
    head = await promptLine('Source branch (head): ');
  }
  if (!head) throw new AdoError('Source branch is required. Use --head <branch>.');

  // Resolve base branch
  let base = options.base ?? getDefaultBase() ?? 'main';

  // Resolve title
  let title = options.title;
  if (!title) {
    if (!process.stdin.isTTY) {
      throw new AdoError('Title is required. Use -t/--title <title>.');
    }
    title = await promptLine('Title: ');
  }
  if (!title) throw new AdoError('Title cannot be empty.');

  const reviewers = options.reviewer
    ? Array.isArray(options.reviewer)
      ? options.reviewer
      : [options.reviewer]
    : [];

  const pr = await createPullRequest(connection, config.project, repoName, {
    title,
    description: options.body,
    sourceBranch: head,
    targetBranch: base,
    isDraft: options.draft ?? false,
    reviewerNames: reviewers,
  });

  if (options.json !== undefined) {
    const { outputJson } = await import('../../output/index.js');
    outputJson(pr);
    return;
  }

  process.stdout.write(`Created PR #${pr.id}: ${pr.title}\n${pr.url}\n`);

  if (options.web) {
    const openMod = await import('open');
    await openMod.default(pr.url);
  }
}

export function registerPrCreate(prCmd: Command): void {
  prCmd
    .command('create')
    .description('Create a pull request')
    .option('-t, --title <title>', 'Pull request title')
    .option('-b, --body <text>', 'Pull request description')
    .option('-B, --base <branch>', 'Target (base) branch')
    .option('-H, --head <branch>', 'Source (head) branch (default: current git branch)')
    .option('-r, --repo <repo>', 'Repository name')
    .option('-d, --draft', 'Create as draft')
    .option('-a, --reviewer <reviewer>', 'Add a reviewer (can be specified multiple times)', (val, prev: string[]) => [...(prev ?? []), val], [] as string[])
    .option('-w, --web', 'Open in browser after creation')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .option('--json [fields]', 'Output as JSON')
    .action(prCreateHandler);
}
