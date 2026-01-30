# CircleCI MCP Server (StyleSeat Fork)

> **This is StyleSeat's fork** of the [official CircleCI MCP Server](https://github.com/CircleCI-Public/mcp-server-circleci). It includes additional tools for debugging CI failures and is installed from source (not published to npm).

Model Context Protocol (MCP) is a [standardized protocol](https://modelcontextprotocol.io/introduction) for managing context between large language models (LLMs) and external systems. This MCP Server lets you use Claude, Cursor, or any MCP client to interact with CircleCI using natural language.

## StyleSeat Additions

This fork adds tools optimized for LLM-driven CI debugging:

| Tool                   | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `get_job_steps`        | List steps in a job with status and duration            |
| `get_step_logs`        | Fetch step logs with failure filtering and tail mode    |
| `list_job_artifacts`   | List artifacts with glob pattern filtering              |
| `get_artifact_content` | Fetch artifact content with optional JUnit/JSON parsing |

### Recommended Debugging Workflow

```
1. get_build_failure_logs                              # Quick "what failed?"
2. get_job_steps                                       # See all steps
3. get_step_logs (stepStatus="failure", tailLines=500) # Get error output
4. list_job_artifacts (pathPattern="**/*.xml")         # Find test results
5. get_artifact_content (parse="junit")                # Extract failures
```

## Requirements

- Node.js >= v18.0.0
- pnpm package manager
- CircleCI Personal API Token ([generate one here](https://app.circleci.com/settings/user/tokens))

## Installation

### 1. Clone and Build

```bash
git clone git@github.com:styleseat/mcp-server-circleci.git
cd mcp-server-circleci
pnpm install
pnpm build
```

### 2. Configure Your MCP Client

#### Claude Code

```bash
claude mcp add circleci-mcp-server \
  -s user \
  -e CIRCLECI_TOKEN=your-circleci-token \
  -- node /path/to/mcp-server-circleci/dist/index.js
```

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "circleci-mcp-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-circleci/dist/index.js"],
      "env": {
        "CIRCLECI_TOKEN": "your-circleci-token"
      }
    }
  }
}
```

#### Cursor / VS Code

Add to your MCP config (`.cursor/mcp.json` or `.vscode/mcp.json`):

```json
{
  "mcpServers": {
    "circleci-mcp-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-circleci/dist/index.js"],
      "env": {
        "CIRCLECI_TOKEN": "your-circleci-token"
      }
    }
  }
}
```

#### Windsurf

Add to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "circleci-mcp-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-circleci/dist/index.js"],
      "env": {
        "CIRCLECI_TOKEN": "your-circleci-token"
      }
    }
  }
}
```

## Supported Tools

### Failure Debugging Tools (StyleSeat additions)

- `get_job_steps` - Lists all steps in a CircleCI job with their status, duration, and log availability. Use this first to understand job structure before drilling into logs.

- `get_step_logs` - Fetches log output for specific steps. Key parameters:

  - `stepStatus: "failure"` - Only get failed steps
  - `tailLines: 500` - Get last 500 lines (where errors usually are)
  - Supports pagination for large logs

- `list_job_artifacts` - Lists artifacts produced by a job. Key parameters:

  - `pathPattern: "**/*.xml"` - Filter by glob pattern
  - `minSize`/`maxSize` - Filter by file size

- `get_artifact_content` - Fetches artifact content. Key parameters:
  - `parse: "junit"` - Parse JUnit XML and extract test failures
  - `parse: "json"` - Parse as JSON
  - `tailLines` - Get last N lines for log files

### Core Tools (from upstream)

- `get_build_failure_logs` - Retrieves failure logs from CircleCI builds
- `get_latest_pipeline_status` - Gets status of the latest pipeline for a branch
- `get_job_test_results` - Retrieves test metadata for jobs
- `find_flaky_tests` - Identifies flaky tests in your project
- `list_followed_projects` - Lists projects you follow on CircleCI
- `run_pipeline` - Triggers a pipeline to run
- `rerun_workflow` - Reruns a workflow from start or from failed job
- `config_helper` - Validates CircleCI configuration

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Watch mode for development
pnpm watch

# Run with MCP Inspector
pnpm inspector
```

## Upstream

This fork tracks [CircleCI-Public/mcp-server-circleci](https://github.com/CircleCI-Public/mcp-server-circleci). To sync with upstream:

```bash
git fetch upstream
git merge upstream/main
```

## License

[MIT](LICENSE)
