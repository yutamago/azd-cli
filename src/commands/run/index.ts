import { Command } from 'commander';
import { registerRunList } from './list.js';
import { registerRunView } from './view.js';
import { registerRunWatch } from './watch.js';
import { registerRunCancel } from './cancel.js';
import { registerRunRerun } from './rerun.js';
import { registerRunDownload } from './download.js';
import { registerRunDelete } from './delete.js';

export function registerRunCommands(program: Command): void {
  const run = program.command('run').description('Manage Azure DevOps pipeline runs');
  registerRunList(run);
  registerRunView(run);
  registerRunWatch(run);
  registerRunCancel(run);
  registerRunRerun(run);
  registerRunDownload(run);
  registerRunDelete(run);
}
