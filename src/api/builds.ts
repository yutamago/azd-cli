import * as azdev from 'azure-devops-node-api';
import { handleApiError } from '../errors/index.js';

export interface BuildSummary {
  id: number;
  buildNumber: string;
  status: string;
  result: string;
  pipelineName: string;
  branch: string;
  requestedBy: string;
  startTime: string;
  finishTime: string;
  url: string;
}

export interface BuildDetail extends BuildSummary {
  sourceBranch: string;
  sourceVersion: string;
  queueTime: string;
  reason: string;
  retainedByRelease: boolean;
}

// BuildStatus enum values
const BUILD_STATUS: Record<number, string> = {
  1: 'in_progress',
  2: 'completed',
  4: 'cancelling',
  8: 'postponed',
  32: 'queued',
};

// BuildResult enum values
const BUILD_RESULT: Record<number, string> = {
  2: 'succeeded',
  4: 'partially_succeeded',
  8: 'failed',
  32: 'cancelled',
};

export function buildStatusStr(status?: number | null): string {
  if (status == null) return 'unknown';
  return BUILD_STATUS[status] ?? 'unknown';
}

export function buildResultStr(result?: number | null): string {
  if (result == null) return '';
  return BUILD_RESULT[result] ?? '';
}

function buildWebUrl(orgUrl: string, project: string, buildId: number): string {
  return `${orgUrl}/${encodeURIComponent(project)}/_build/results?buildId=${buildId}`;
}

function toBuildSummary(b: Record<string, unknown>, orgUrl: string, project: string): BuildSummary {
  return {
    id: b['id'] as number ?? 0,
    buildNumber: String(b['buildNumber'] ?? ''),
    status: buildStatusStr(b['status'] as number),
    result: buildResultStr(b['result'] as number),
    pipelineName: (b['definition'] as { name?: string } | undefined)?.name ?? '',
    branch: String(b['sourceBranch'] ?? '').replace('refs/heads/', ''),
    requestedBy: (b['requestedBy'] as { displayName?: string } | undefined)?.displayName ?? '',
    startTime: String(b['startTime'] ?? ''),
    finishTime: String(b['finishTime'] ?? ''),
    url: buildWebUrl(orgUrl, project, b['id'] as number ?? 0),
  };
}

export async function listBuilds(
  connection: azdev.WebApi,
  project: string,
  options: { limit?: number; statusFilter?: number; branch?: string }
): Promise<BuildSummary[]> {
  const buildApi = await connection.getBuildApi();
  const orgUrl = (connection as unknown as { _serverUrl: string })._serverUrl ?? '';

  try {
    const builds = await buildApi.getBuilds(
      project,
      undefined, // definitions
      undefined, // queues
      undefined, // buildNumber
      undefined, // minTime
      undefined, // maxTime
      undefined, // requestedFor
      undefined, // reasonFilter
      options.statusFilter, // statusFilter
      undefined, // resultFilter
      undefined, // tagFilters
      undefined, // properties
      options.limit ?? 30,
      undefined, // continuationToken
      undefined, // maxBuildsPerDefinition
      undefined, // deletedFilter
      undefined, // queryOrder
      options.branch ? `refs/heads/${options.branch}` : undefined,
    );

    return (builds ?? []).map((b) => toBuildSummary(b as unknown as Record<string, unknown>, orgUrl, project));
  } catch (err) {
    handleApiError(err, 'Pipeline runs');
  }
}

export async function getBuild(
  connection: azdev.WebApi,
  project: string,
  buildId: number
): Promise<BuildDetail> {
  const buildApi = await connection.getBuildApi();
  const orgUrl = (connection as unknown as { _serverUrl: string })._serverUrl ?? '';

  try {
    const b = await buildApi.getBuild(project, buildId);
    const bRaw = b as unknown as Record<string, unknown>;
    return {
      ...toBuildSummary(bRaw, orgUrl, project),
      sourceBranch: String(bRaw['sourceBranch'] ?? '').replace('refs/heads/', ''),
      sourceVersion: String(bRaw['sourceVersion'] ?? '').slice(0, 8),
      queueTime: String(bRaw['queueTime'] ?? ''),
      reason: String(bRaw['reason'] ?? ''),
      retainedByRelease: Boolean(bRaw['retainedByRelease']),
    };
  } catch (err) {
    handleApiError(err, `Run #${buildId}`);
  }
}
