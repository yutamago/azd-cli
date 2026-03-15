# TODO

## Done
- [x] Project scaffolding (package.json, tsconfig.json, .gitignore)
- [x] Foundation modules (errors, config, auth/store)
- [x] API client factory (azure-devops-node-api, PAT auth)
- [x] Output module (TTY/non-TTY, table/detail/json)
- [x] `azd auth login` — PAT-based auth with keytar + file fallback
- [x] `azd issue list` — list work items with state/assignee/tag/type filters
- [x] `azd issue view <id>` — work item detail view with optional comments
- [x] `azd pr list` — list PRs with state/author/repo filters
- [x] `azd pr view <pr>` — PR detail with optional comment threads
- [x] `azd pr comment <pr>` — add comment (--body or $EDITOR)
- [x] `azd pr diff <pr>` — real unified diff with `--color`, `--exclude`, `--name-only`, `--patch`, `--web` flags matching `gh pr diff`
- [x] OAuth browser login as default auth (MSAL `acquireTokenInteractive`); device code flow for headless/CI
- [x] DEP0169 deprecation warning suppression (upstream: azure-devops-node-api#664, fix: PR#662)
- [x] `azd search issues <query>` — search work items via WIQL
- [x] `azd search code <query>` — search code via Azure Search REST API
- [x] `azd search commits <query>` — search commits (client-side filter)
- [x] `azd search prs <query>` — search PRs (client-side filter)
- [x] `azd search repos <query>` — list/filter repositories
- [x] `azd auth status` — show current auth state
- [x] `azd auth logout` — remove stored credentials
- [x] After login: numbered list project selector (TTY) / plain stdin line-read (non-TTY, AI agent compatible)
- [x] `azd issue create` — create a new work item (type, title, description, assignee, tags)
- [x] `azd issue edit <id>` — update title, description, state, assignee, tags on an existing work item
- [x] `azd issue close <id>` — set work item state to Closed/Resolved
- [x] `azd issue reopen <id>` — set work item state back to Active
- [x] `azd issue comment <id>` — add a comment to a work item (mirrors `azd pr comment`)
- [x] `azd issue status` — show work items assigned to you / created by you
- [x] `azd issue list --web` / `azd issue view --web` — open in browser
- [x] `azd issue develop <id>` — create a branch linked to a work item (`GitApi.updateRefs` + `WorkItemTrackingApi.updateWorkItem` with ArtifactLink relation)
- [x] `azd pr create` — create a pull request
- [x] `azd pr review` — approve/reject a PR
- [x] `azd pr list --web` / `azd pr view --web` — open in browser
- [x] `azd search projects <query>` — list/filter Azure DevOps projects (`CoreApi.getProjects` + client-side filter)
- [x] `azd repo list` — list repositories
- [x] `azd repo clone` — clone a repository
- [x] `azd run list` — list recent pipeline runs (`BuildApi.getBuilds`)
- [x] `azd run view <run-id>` — show details of a specific run; `--web` to open in browser
- [x] `azd run watch <run-id>` — stream live status until run completes
- [x] `azd run cancel <run-id>` — cancel an in-progress run (`BuildApi.updateBuild` status=Cancelling)
- [x] `azd run rerun <run-id>` — re-queue a completed/failed run (`BuildApi.updateBuild` retry=true)
- [x] `azd run download <run-id>` — download build artifacts (`BuildApi.getArtifacts`)
- [x] `azd run delete <run-id>` — delete a pipeline run record
- [x] `azd completion` — generate shell completion scripts (bash/zsh/fish/powershell)
- [x] `--web` / `-w` flag audit — added to: `issue list`, `issue view`, `pr list`, `pr view`, `run list`, `run view`

## Backlog

- [ ] Tests
