# Game Logs MCP Server

This MCP server provides functionality to retrieve game logs from the Lumigame platform.

## Features

- Retrieve recent game logs
- Retrieve sign-in logs
- Filter logs by player ID
- Configure number of logs to retrieve

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Usage

The server provides a single tool called `getLogs` with the following parameters:

- `logType` (required): Either 'recentLogs' or 'signinLogs'
- `playerId` (optional): Filter logs by player ID
- `limit` (optional): Number of logs to retrieve (default: 10)

### Example Usage

```typescript
// Get recent logs
const recentLogs = await getLogs({
  logType: 'recentLogs',
  limit: 20
});

// Get sign-in logs for a specific player
const signinLogs = await getLogs({
  logType: 'signinLogs',
  playerId: 'player123',
  limit: 5
});
```

## API Endpoints

- Recent Logs: `https://l1-proxy.lumigame.com/admin-logs-api/logs/top`
- Sign-in Logs: `https://l1-proxy.lumigame.com/admin-logs-api/logs/sign-ins/top`

## Response Format

The server returns responses in the following format:

```typescript
interface LogResponse {
  success: boolean;
  data: any[];
  error?: string;
}
```
