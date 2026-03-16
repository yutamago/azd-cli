# Azure DevOps CLI for Agents

A minimal CLI to access information from Azure DevOps.
Optimized for agentic use cases, very similar commands to Github CLI and low token usage.

This CLI should enable a GitHub user to use Azure DevOps immediately.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

Update `CLAUDE.md` as the project evolves.

## Project Structure

```
src/
  index.ts               # CLI entry point, Commander root, DEP0169 suppression
  api/
    client.ts            # WebApi factory; credential priority: SYSTEM_ACCESSTOKEN > AZURE_DEVOPS_TOKEN > stored
    workItems.ts         # Work item CRUD, comments, branch linking
    pullRequests.ts      # PR listing, diff, review, threads
    builds.ts            # Pipeline run list/view/cancel/rerun/download/delete
    search.ts            # Code (Azure Search REST), commits, repos (client-side filter)
  auth/
    store.ts             # Keytar + ~/.azd/credentials.json fallback
    oauth.ts             # MSAL OAuth2 (browser + device-code flows)
  commands/
    auth/                # login, logout, status
    issue/               # list, view, create, edit, close, reopen, comment, status, develop
    pr/                  # list, view, comment, diff, create, review
    run/                 # list, view, watch, cancel, rerun, download, delete
    search/              # issues, code, commits, prs, repos, projects
    repo/                # list, clone
    completion.ts        # Shell completions (bash/zsh/fish/powershell)
  config/index.ts        # Config load: CLI > env > git remote > ~/.azd/config.json
  output/index.ts        # TTY/non-TTY formatting, table, detail, JSON
  errors/index.ts        # AzdError, AuthError, NotFoundError, ConfigError
```

## Commands Reference

### Auth
| Command | Description |
|---|---|
| `azd auth login` | OAuth browser login (default); device-code for headless/CI |
| `azd auth logout` | Remove stored credentials |
| `azd auth status` | Show org, auth type, username, default project |

### Issues (Work Items)
| Command | Description |
|---|---|
| `azd issue list` | List work items (`--state`, `--assignee`, `--tag`, `--type`, `--web`) |
| `azd issue view <id>` | Work item details (`--comments`, `--web`) |
| `azd issue create` | Create work item (`--type`, `--title`, `--description`, `--assignee`, `--tags`) |
| `azd issue edit <id>` | Update work item fields |
| `azd issue close <id>` | Set state to Closed/Resolved |
| `azd issue reopen <id>` | Set state back to Active |
| `azd issue comment <id>` | Add comment (`--body` or `$EDITOR`) |
| `azd issue status` | Show items assigned to / created by you |
| `azd issue develop <id>` | Create branch linked to work item |

### Pull Requests
| Command | Description |
|---|---|
| `azd pr list` | List PRs (`--state`, `--author`, `--repo`, `--web`) |
| `azd pr view <pr>` | PR details (`--comments`, `--web`) |
| `azd pr comment <pr>` | Add comment (`--body` or `$EDITOR`) |
| `azd pr diff <pr>` | Unified diff (`--color`, `--exclude`, `--name-only`, `--patch`, `--web`) |
| `azd pr create` | Create PR (`--title`, `--body`, `--draft`, `--source-branch`, `--target-branch`) |
| `azd pr review <pr>` | Approve/reject (`--approve`, `--reject`, `--comment`) |

### Pipeline Runs
| Command | Description |
|---|---|
| `azd run list` | List recent runs (`--status`, `--branch`, `--limit`, `--web`) |
| `azd run view <run-id>` | Run details (`--web`) |
| `azd run watch <run-id>` | Stream live status until completion |
| `azd run cancel <run-id>` | Cancel an in-progress run |
| `azd run rerun <run-id>` | Re-queue a completed/failed run |
| `azd run download <run-id>` | Download build artifacts |
| `azd run delete <run-id>` | Delete pipeline run record |

### Search
| Command | Description |
|---|---|
| `azd search issues <query>` | Search work items via WIQL |
| `azd search code <query>` | Search code via Azure Search REST API (`--repo`, `--limit`) |
| `azd search commits <query>` | Search commits (client-side filter) |
| `azd search prs <query>` | Search PRs (client-side filter) |
| `azd search repos <query>` | List/filter repositories |
| `azd search projects <query>` | List/filter Azure DevOps projects |

### Repo
| Command | Description |
|---|---|
| `azd repo list` | List repositories |
| `azd repo clone <repo>` | Clone a repository |

### Other
| Command | Description |
|---|---|
| `azd completion` | Generate shell completion script (bash/zsh/fish/powershell) |

## Authentication Architecture

Credential resolution order in `src/api/client.ts`:
1. `SYSTEM_ACCESSTOKEN` env var — Azure Pipelines built-in token
2. `AZURE_DEVOPS_TOKEN` env var — explicit PAT for scripts/CI
3. Stored credential (OAuth token or PAT) — persisted across sessions

OAuth uses MSAL `PublicClientApplication` with browser redirect (loopback), falling back to device-code for headless environments. Tokens are stored via keytar (native credential manager) with `~/.azd/credentials.json` as a file fallback.

Config location: `~/.azd/` (`config.json`, `credentials.json`, `oauth-cache.json`)

## Configuration Resolution Order

CLI flags → environment variables → git remote (auto-detect org/project) → `~/.azd/config.json`

Environment variables: `AZURE_DEVOPS_TOKEN`, `SYSTEM_ACCESSTOKEN`, `AZURE_DEVOPS_ORG`, `AZURE_DEVOPS_PROJECT`

Git remote formats supported:
- `https://dev.azure.com/{org}/{project}/_git/{repo}`
- `https://{org}.visualstudio.com/{project}/_git/{repo}`
- `git@ssh.dev.azure.com:v3/{org}/{project}/{repo}`

## Output & Agent Compatibility

- **TTY**: styled tables (cli-table3), colored state labels
- **non-TTY**: tab-separated plain text — machine-readable, agent-compatible
- `--json` flag available on most commands for structured output
- `--web` / `-w` flag available on most list/view commands to open in browser

## Task Tracking

- **Always check TODO.md** before starting work
- **Update TODO.md** as tasks are completed (`[x]`), started (`[~]`), or skipped (`[-]`)
- Keep TODO.md as the single source of truth for project status

## Keeping the Plugin Reference Up to Date

`plugins/azd/skills/azd-cli/reference.md` is the authoritative CLI reference used by the azd plugin skill.

**Update it whenever you:**
- Add, rename, or remove a command or subcommand
- Add, rename, remove, or change the default of any flag
- Change the short alias of a flag (e.g. `-s`, `-a`)
- Change flag behavior (e.g. making a flag repeatable, changing accepted values)
- Add or remove global flags

Keep the reference in sync with the source — it is generated from the actual `commander` registrations in `src/commands/**/*.ts`.

## Core Principles

- `azd` commands should work the same as their `gh` counterparts, unless the Azure DevOps API makes this impossible.
- If the user uses an unrecognized command, return a clear message explaining the wrong usage and how to properly use the command.
- The core target audience for this CLI is Agents (such as Claude and GitHub Copilot).

## Known Issues

- **DEP0169**: Upstream deprecation warning from `azure-devops-node-api` (uses `url.parse()`). Suppressed in `src/index.ts` by intercepting `process.emit('warning')`. Tracked at [azure-devops-node-api#664](https://github.com/microsoft/azure-devops-node-api/issues/664).

## References

- [GitHub CLI manual](https://cli.github.com/manual/)
- [Azure DevOps API TypeScript client library](https://github.com/microsoft/azure-devops-extension-api)
- [azure-devops-node-api](https://github.com/microsoft/azure-devops-node-api)
