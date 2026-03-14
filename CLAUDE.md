# Azure DevOps CLI for Agents

A minimal CLI to access information from Azure DevOps.
Optimized for agentic use cases, very similar commands to Github CLI and low token usage.

This CLI should enable a github user, to use Azure DevOps immediately.


This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

Update `CLAUDE.md` as the project evolves.

## Project Structure

...

## Task Tracking

- **Always check TODO.md** before starting work
- **Update TODO.md** as tasks are completed (`[x]`), started (`[~]`), or skipped (`[-]`)
- Keep TODO.md as the single source of truth for project status

## Core Principles

- `azd` commands should work the same as their `gh` counterparts, unless the Azure DevOps API makes this impossible.
- If the user uses an unrecognized command, return a clear message explaining the wrong usage and how to properly use the command.
- The core target audience for this CLI is Agents (such as Claude and Github Copilot)

## References

- [Github CLI manual](https://cli.github.com/manual/)
- [Azure DevOps API Typescript client library](https://github.com/microsoft/azure-devops-extension-api)
