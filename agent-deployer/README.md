# Agent Deployer

A service for deploying and monitoring Kadena agents on AWS App Runner with comprehensive log viewing capabilities.

## Features

- Deploy agents to AWS App Runner
- View application logs for deployed agents with real-time monitoring
- List all deployed agents with log availability status
- API key authentication for secure access
- Modular code structure for maintainability

## Project Structure

```
agent-deployer/
├── index.js          # Main server with routes and authentication
├── deploy.js         # Agent deployment logic
├── logs.js           # Log viewing and monitoring functionality
├── constants.js      # Shared constants and code templates
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## API Endpoints

### Authentication

All endpoints require API key authentication via the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/endpoint
```

### Deploy Agent

```
POST /deploy-agent
```

**Request Body:**

```json
{
  "agentId": "unique-agent-id",
  "baselineFunction": "function code...",
  "intervalFunction": "function code...",
  "publicKey": "agent-public-key",
  "privateKey": "agent-private-key"
}
```

**Response:**

```json
{
  "agentUrl": "https://agent-xxx.us-east-1.awsapprunner.com"
}
```

### List Deployed Agents

```
GET /agents
```

**Response:**

```json
{
  "agents": [
    {
      "agentId": "unique-agent-id",
      "serviceName": "agent-unique-agent-id",
      "serviceUrl": "https://agent-xxx.us-east-1.awsapprunner.com",
      "status": "RUNNING",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "hasLogs": true,
      "logGroupName": "/aws/apprunner/agent-xxx/abc123/application"
    }
  ]
}
```

### Get Agent Logs

```
GET /agent-logs/:agentId
```

**Query Parameters:**

- `startTime` (optional): Unix timestamp for start time
- `endTime` (optional): Unix timestamp for end time
- `limit` (optional): Maximum number of log events (default: 100)

**Response:**

```json
{
  "logs": {
    "logGroupName": "/aws/apprunner/agent-xxx/abc123/application",
    "events": [
      {
        "timestamp": 1704067200000,
        "message": "Agent started successfully",
        "logStreamName": "apprunner/agent-xxx/application/xxx"
      }
    ],
    "nextToken": "token-for-pagination",
    "searchedLogStreams": [],
    "totalEvents": 1
  }
}
```

### Get Agent Logs Tail (Real-time)

```
GET /agent-logs/:agentId/tail
```

**Query Parameters:**

- `lines` (optional): Number of recent log lines to return (default: 50)

**Response:**

```json
{
  "logs": {
    "logGroupName": "/aws/apprunner/agent-xxx/abc123/application",
    "events": [
      {
        "timestamp": 1704067200000,
        "message": "Agent started successfully",
        "logStreamName": "apprunner/agent-xxx/application/xxx"
      }
    ],
    "totalEvents": 1,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Agent Logs

```
GET /agent-logs/:agentId/all
```

**Query Parameters:**

- `startTime` (optional): Unix timestamp for start time
- `endTime` (optional): Unix timestamp for end time
- `limit` (optional): Maximum number of log events (default: 1000)

Returns as many logs as possible for the agent with pagination support.

### Debug Log Groups

```
GET /debug/log-groups
```

Returns all CloudWatch log groups for App Runner services (useful for troubleshooting).

## Environment Variables

Required environment variables:

- `AWS_REGION`: AWS region for deployment
- `AWS_ACCOUNT_ID`: AWS account ID
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `API_KEY`: API key for authentication (e.g., "Commune_dev1")
- `PORT`: Server port (default: 3000)

Optional environment variables:

- `PASSWORD`: Password for agents

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

The server will start on port 3000 (or the port specified in the PORT environment variable).

## API Usage Examples

```bash
# List all deployed agents
curl -H "x-api-key: Commune_dev1" http://localhost:3000/agents

# Get logs for a specific agent
curl -H "x-api-key: Commune_dev1" http://localhost:3000/agent-logs/my-agent-id

# Get recent logs (last 50 lines)
curl -H "x-api-key: Commune_dev1" "http://localhost:3000/agent-logs/my-agent-id/tail?lines=50"

# Get all logs with higher limit
curl -H "x-api-key: Commune_dev1" "http://localhost:3000/agent-logs/my-agent-id/all?limit=1000"

# Get logs within a time range
curl -H "x-api-key: Commune_dev1" "http://localhost:3000/agent-logs/my-agent-id?startTime=1704067200000&endTime=1704153600000"
```

## IAM Permissions

Your IAM user needs the following permissions:

- `apprunner:*` - For App Runner service management
- `ecr:*` - For ECR repository management
- `logs:*` - For CloudWatch Logs access
- `iam:PassRole` - For App Runner service role

## Log Access

The service automatically creates CloudWatch log groups for each deployed agent with the pattern:
`/aws/apprunner/agent-{agentId}/{unique-id}/application`

Logs are automatically streamed from App Runner to CloudWatch Logs, so you can view them through:

1. The API endpoints provided by this service
2. AWS CloudWatch console
3. AWS CLI
4. Other CloudWatch Logs clients

## Code Architecture

### Modular Design

The codebase is organized into focused modules:

- **`index.js`**: Express server, authentication middleware, and route definitions
- **`deploy.js`**: Agent deployment logic using AWS App Runner and ECR
- **`logs.js`**: Log viewing functionality with CloudWatch integration
- **`constants.js`**: Shared constants and code templates

### Key Features

- **Dynamic Log Group Discovery**: Automatically finds the correct CloudWatch log group names
- **Pagination Support**: Handles large log volumes with proper pagination
- **Real-time Monitoring**: Tail endpoint for live log monitoring
- **Error Handling**: Graceful handling of missing logs and network issues
- **API Key Security**: Secure access control for all endpoints

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Ensure you're including the correct `x-api-key` header
2. **"No logs found"**: Agent might not have started yet or no logs generated
3. **CloudWatch errors**: Check IAM permissions for CloudWatch Logs access
4. **App Runner errors**: Verify App Runner service role and permissions

### Debug Endpoints

Use the debug endpoints to troubleshoot:

- `/debug/log-groups` - List all available log groups
- `/agents` - Check agent status and log availability
