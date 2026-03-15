import { Command } from 'commander';
import { registerIssueList } from './list.js';
import { registerIssueView } from './view.js';
import { registerIssueCreate } from './create.js';
import { registerIssueEdit } from './edit.js';
import { registerIssueClose } from './close.js';
import { registerIssueReopen } from './reopen.js';
import { registerIssueComment } from './comment.js';
import { registerIssueStatus } from './status-cmd.js';
import { registerIssueDevelop } from './develop.js';

export function registerIssueCommands(program: Command): void {
  const issue = program.command('issue').description('Manage Azure DevOps work items');
  registerIssueList(issue);
  registerIssueView(issue);
  registerIssueCreate(issue);
  registerIssueEdit(issue);
  registerIssueClose(issue);
  registerIssueReopen(issue);
  registerIssueComment(issue);
  registerIssueStatus(issue);
  registerIssueDevelop(issue);
}
