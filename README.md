# azd-cli

Azure DevOps CLI for agents — mirrors [GitHub CLI](https://cli.github.com/) (`gh`) conventions.

## Installation

```bash
npm install -g azd-cli
```

**Prerequisites:** Node.js 18 or later, an Azure DevOps account.

---

## Authentication

```bash
azd auth login           # Browser OAuth (default)
azd auth login --device  # Device-code flow for headless/CI environments
azd auth status          # Show current auth state
azd auth logout          # Remove stored credentials
```

After login you will be prompted to select a default organization and project. These can also be set via environment variables:

```
AZURE_DEVOPS_ORG=https://dev.azure.com/myorg
AZURE_DEVOPS_PROJECT=my-project
```

For CI pipelines, set `SYSTEM_ACCESSTOKEN` (Azure Pipelines built-in) or `AZURE_DEVOPS_TOKEN` (PAT) — no login step required.

---

## Commands

### Issues (Work Items)

```bash
azd issue list                                         # List work items
azd issue list --state Active --assignee @me
azd issue view <id>                                    # Work item details
azd issue view <id> --comments
azd issue create --title "Bug report" --type Bug
azd issue edit <id> --state Resolved
azd issue close <id>
azd issue reopen <id>
azd issue comment <id> --body "LGTM"
azd issue status                                       # Items assigned to / created by you
azd issue develop <id>                                 # Create a branch linked to the work item
```

### Pull Requests

```bash
azd pr list
azd pr list --state abandoned --author @me
azd pr view <pr>
azd pr view <pr> --comments
azd pr diff <pr>
azd pr diff <pr> --name-only
azd pr comment <pr> --body "Looks good"
azd pr create --title "My PR" --draft
azd pr review <pr> --approve
azd pr review <pr> --reject --comment "Needs changes"
```

### Pipeline Runs

```bash
azd run list
azd run list --status failed --branch main
azd run view <run-id>
azd run watch <run-id>
azd run cancel <run-id>
azd run rerun <run-id>
azd run download <run-id>
azd run delete <run-id>
```

### Search

```bash
azd search issues "memory leak"
azd search code "TodoController" --repo my-repo
azd search commits "fix auth"
azd search prs "login"
azd search repos "api"
azd search projects "platform"
```

### Repositories

```bash
azd repo list
azd repo clone <repo>
```

### Shell Completions

```bash
azd completion bash        >> ~/.bashrc
azd completion zsh         >> ~/.zshrc
azd completion fish        > ~/.config/fish/completions/azd.fish
azd completion powershell  >> $PROFILE
```

---

## Output Modes

| Mode | Behavior |
|---|---|
| TTY | Styled tables and colored state labels |
| non-TTY (pipe / agent) | Tab-separated plain text — machine-readable |
| `--json` | Structured JSON (available on most commands) |
| `--web` / `-w` | Open the result in a browser |

Non-TTY output is optimized for agent consumption (GitHub Copilot, Claude, etc.).

---

## Configuration

Config is resolved in this order:

1. CLI flags (`--org`, `--project`)
2. Environment variables (`AZURE_DEVOPS_ORG`, `AZURE_DEVOPS_PROJECT`)
3. Git remote (auto-detected from `origin`)
4. `~/.azd/config.json`

Supported remote URL formats:

- `https://dev.azure.com/{org}/{project}/_git/{repo}`
- `https://{org}.visualstudio.com/{project}/_git/{repo}`
- `git@ssh.dev.azure.com:v3/{org}/{project}/{repo}`

---

## License

MIT — see [LICENSE](./LICENSE).
