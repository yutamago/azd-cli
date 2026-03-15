import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { reviewPullRequest, resolveRepo } from '../../api/pullRequests.js';
import { getConfig } from '../../config/index.js';
import { AzdError } from '../../errors/index.js';

async function prReviewHandler(
  prId: string,
  options: {
    approve?: boolean;
    reject?: boolean;
    requestChanges?: boolean;
    body?: string;
    repo?: string;
    project?: string;
    org?: string;
  }
): Promise<void> {
  const numId = parseInt(prId, 10);
  if (isNaN(numId)) {
    process.stderr.write(`azd: invalid PR number: ${prId}\n`);
    process.exit(1);
  }

  // Exactly one action must be provided
  const actions = [options.approve, options.reject, options.requestChanges].filter(Boolean);
  if (actions.length === 0) {
    throw new AzdError('Specify one of: --approve, --reject, --request-changes');
  }
  if (actions.length > 1) {
    throw new AzdError('Specify only one of: --approve, --reject, --request-changes');
  }

  // Vote values (Azure DevOps): 10=Approved, -10=Rejected, -5=Waiting for author
  let vote: number;
  if (options.approve) vote = 10;
  else if (options.reject) vote = -10;
  else vote = -5; // requestChanges

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const repoName = await resolveRepo(connection, config.project, options.repo);

  await reviewPullRequest(connection, config.project, repoName, numId, vote);

  const voteLabel = options.approve ? 'Approved' : options.reject ? 'Rejected' : 'Requested changes on';
  process.stdout.write(`${voteLabel} PR #${numId}\n`);
}

export function registerPrReview(prCmd: Command): void {
  prCmd
    .command('review <pr-number>')
    .description('Submit a review for a pull request')
    .option('--approve', 'Approve the pull request')
    .option('--reject', 'Reject the pull request')
    .option('--request-changes', 'Request changes (waiting for author)')
    .option('-b, --body <text>', 'Review comment (optional)')
    .option('-r, --repo <repo>', 'Repository name')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(prReviewHandler);
}
