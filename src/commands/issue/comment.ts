import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as child_process from 'child_process';
import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { addWorkItemComment } from '../../api/workItems.js';
import { getConfig } from '../../config/index.js';
import { AzdError } from '../../errors/index.js';

function openEditor(initial = ''): string {
  const editor =
    process.env['VISUAL'] ?? process.env['EDITOR'] ?? (process.platform === 'win32' ? 'notepad' : 'vi');
  const tmpFile = path.join(os.tmpdir(), `azd-issue-comment-${Date.now()}.md`);
  fs.writeFileSync(tmpFile, initial, 'utf8');

  try {
    child_process.execFileSync(editor, [tmpFile], { stdio: 'inherit' });
  } catch {
    // editor may exit non-zero on cancel
  }

  const content = fs.readFileSync(tmpFile, 'utf8').trim();
  fs.unlinkSync(tmpFile);
  return content;
}

async function issueCommentHandler(
  id: string,
  options: { body?: string; editor?: boolean; project?: string; org?: string }
): Promise<void> {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    process.stderr.write(`azd: invalid work item ID: ${id}\n`);
    process.exit(1);
  }

  let body = options.body;
  if (!body || options.editor) {
    body = openEditor(body ?? '');
  }

  if (!body) {
    throw new AzdError('Comment body cannot be empty.');
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  await addWorkItemComment(connection, config.project, numId, body);
  process.stdout.write(`Added comment to work item #${numId}\n`);
}

export function registerIssueComment(issueCmd: Command): void {
  issueCmd
    .command('comment <id>')
    .description('Add a comment to a work item')
    .option('-b, --body <text>', 'Comment body')
    .option('--editor', 'Open editor to write the comment')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(issueCommentHandler);
}
