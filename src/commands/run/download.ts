import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { getWebApi } from '../../api/client.js';
import { getConfig } from '../../config/index.js';
import { AzdError, handleApiError } from '../../errors/index.js';

async function streamToFile(stream: NodeJS.ReadableStream, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    stream.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
    stream.on('error', reject);
  });
}

async function runDownloadHandler(
  runId: string,
  options: { name?: string; dir?: string; project?: string; org?: string }
): Promise<void> {
  const numId = parseInt(runId, 10);
  if (isNaN(numId)) {
    process.stderr.write(`azd: invalid run ID: ${runId}\n`);
    process.exit(1);
  }

  const config = getConfig({ orgUrl: options.org, project: options.project });
  const connection = await getWebApi(config.orgUrl);
  const buildApi = await connection.getBuildApi();
  const outDir = options.dir ?? '.';

  try {
    fs.mkdirSync(outDir, { recursive: true });
    const artifacts = await buildApi.getArtifacts(config.project, numId);

    if (!artifacts || artifacts.length === 0) {
      process.stdout.write(`No artifacts found for run #${numId}\n`);
      return;
    }

    const toDownload = options.name
      ? artifacts.filter((a) => a.name === options.name)
      : artifacts;

    if (toDownload.length === 0) {
      throw new AzdError(`Artifact '${options.name}' not found in run #${numId}`);
    }

    for (const artifact of toDownload) {
      const artifactName = artifact.name ?? `artifact-${artifact.id}`;
      const filePath = path.join(outDir, `${artifactName}.zip`);
      process.stdout.write(`Downloading ${artifactName}... `);
      const stream = await buildApi.getArtifactContentZip(config.project, numId, artifactName);
      await streamToFile(stream as unknown as NodeJS.ReadableStream, filePath);
      process.stdout.write(`saved to ${filePath}\n`);
    }
  } catch (err) {
    handleApiError(err, `Run #${numId}`);
  }
}

export function registerRunDownload(runCmd: Command): void {
  runCmd
    .command('download <run-id>')
    .description('Download artifacts from a pipeline run')
    .option('-n, --name <artifact>', 'Artifact name (downloads all if omitted)')
    .option('-D, --dir <dir>', 'Output directory (default: current directory)')
    .option('-p, --project <project>', 'Azure DevOps project (overrides config)')
    .option('--org <url>', 'Azure DevOps organization URL (overrides config)')
    .action(runDownloadHandler);
}
