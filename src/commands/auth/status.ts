import { Command } from 'commander';
import { getOrgUrl, getRemoteContext, loadConfigFile } from '../../config/index.js';
import { loadCredential } from '../../auth/store.js';
import { getWebApi } from '../../api/client.js';
import { outputDetail, outputJson } from '../../output/index.js';

async function authStatusHandler(options: { org?: string; json?: string | boolean }): Promise<void> {
  const remote = getRemoteContext();
  const isJson = options.json !== undefined;
  const jsonFields = typeof options.json === 'string' ? options.json : undefined;

  let orgUrl: string;
  try {
    orgUrl = getOrgUrl(options.org);
  } catch {
    if (isJson) {
      outputJson({
        authenticated: false,
        detectedOrg: remote.orgUrl ?? '',
        detectedProject: remote.project ?? '',
        detectedRepo: remote.repo ?? '',
      }, jsonFields);
    } else {
      process.stdout.write('Not authenticated. Run: ado auth login\n');
      if (remote.orgUrl) process.stdout.write(`detected org:     ${remote.orgUrl}\n`);
      if (remote.project) process.stdout.write(`detected project: ${remote.project}\n`);
      if (remote.repo) process.stdout.write(`detected repo:    ${remote.repo}\n`);
    }
    return;
  }

  const cred = await loadCredential(orgUrl);
  if (!cred) {
    if (isJson) {
      outputJson({
        authenticated: false,
        orgUrl,
        detectedOrg: remote.orgUrl ?? '',
        detectedProject: remote.project ?? '',
        detectedRepo: remote.repo ?? '',
      }, jsonFields);
    } else {
      process.stdout.write(`Not authenticated for ${orgUrl}. Run: ado auth login\n`);
      if (remote.orgUrl) process.stdout.write(`detected org:     ${remote.orgUrl}\n`);
      if (remote.project) process.stdout.write(`detected project: ${remote.project}\n`);
      if (remote.repo) process.stdout.write(`detected repo:    ${remote.repo}\n`);
    }
    return;
  }

  let username = '';
  try {
    const connection = await getWebApi(orgUrl);
    const connData = await connection.connect();
    username =
      connData?.authenticatedUser?.providerDisplayName ??
      connData?.authenticatedUser?.subjectDescriptor ??
      '';
  } catch {
    // non-fatal — show status even if we can't reach the server
  }

  const config = loadConfigFile();

  if (isJson) {
    outputJson(
      {
        authenticated: true,
        orgUrl,
        authType: cred.type,
        username,
        defaultProject: config.project ?? '',
        detectedOrg: remote.orgUrl ?? '',
        detectedProject: remote.project ?? '',
        detectedRepo: remote.repo ?? '',
      },
      jsonFields,
    );
    return;
  }

  const rows: [string, string][] = [
    ['org', orgUrl],
    ['auth type', cred.type],
    ['username', username],
    ['default project', config.project ?? '(not set)'],
  ];

  if (remote.orgUrl) rows.push(['detected org', remote.orgUrl]);
  if (remote.project) rows.push(['detected project', remote.project]);
  if (remote.repo) rows.push(['detected repo', remote.repo]);

  outputDetail(rows);
}

export function registerAuthStatus(authCmd: Command): void {
  authCmd
    .command('status')
    .description('View authentication status')
    .option('--org <url>', 'Azure DevOps organization URL')
    .option('--json [fields]', 'Output as JSON')
    .action(authStatusHandler);
}
