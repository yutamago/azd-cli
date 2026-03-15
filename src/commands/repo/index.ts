import { Command } from 'commander';
import { registerRepoList } from './list.js';
import { registerRepoClone } from './clone.js';

export function registerRepoCommands(program: Command): void {
  const repo = program.command('repo').description('Manage Azure DevOps repositories');
  registerRepoList(repo);
  registerRepoClone(repo);
}
