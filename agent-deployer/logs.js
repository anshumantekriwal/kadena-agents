const {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  DescribeLogGroupsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");
const {
  AppRunnerClient,
  ListServicesCommand,
} = require("@aws-sdk/client-apprunner");

async function getAgentLogs(agentId, options = {}) {
  const { startTime, endTime, limit = 100 } = options;

  const cloudWatchLogs = new CloudWatchLogsClient({
    region: process.env.AWS_REGION,
  });

  // First, try to find the actual log group name by listing log groups with the agent prefix
  let actualLogGroupName = null;
  try {
    const listCommand = new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/apprunner/agent-${agentId}/`,
    });
    const listResponse = await cloudWatchLogs.send(listCommand);

    if (listResponse.logGroups && listResponse.logGroups.length > 0) {
      // Find the application log group (it should contain 'application' in the name)
      const appLogGroup = listResponse.logGroups.find((lg) =>
        lg.logGroupName.includes("/application")
      );
      if (appLogGroup) {
        actualLogGroupName = appLogGroup.logGroupName;
      }
    }
  } catch (error) {
    console.error("Error finding log group:", error);
  }

  if (!actualLogGroupName) {
    return {
      logGroupName: `/aws/apprunner/agent-${agentId}/application`,
      events: [],
      message:
        "No logs found for this agent. The agent might not have started yet or no logs have been generated.",
    };
  }

  const params = {
    logGroupName: actualLogGroupName,
    limit,
    startFromHead: true, // Get logs from the beginning to ensure we don't miss any
  };

  if (startTime) {
    params.startTime = startTime;
  }

  if (endTime) {
    params.endTime = endTime;
  }

  try {
    const command = new FilterLogEventsCommand(params);
    const response = await cloudWatchLogs.send(command);

    // Get all events by paginating through results
    let allEvents = response.events || [];
    let nextToken = response.nextToken;

    // Continue fetching until we have all events or reach the limit
    while (nextToken && allEvents.length < limit) {
      const nextParams = { ...params, nextToken };
      const nextCommand = new FilterLogEventsCommand(nextParams);
      const nextResponse = await cloudWatchLogs.send(nextCommand);

      allEvents = allEvents.concat(nextResponse.events || []);
      nextToken = nextResponse.nextToken;
    }

    return {
      logGroupName: actualLogGroupName,
      events: allEvents,
      nextToken: nextToken,
      searchedLogStreams: response.searchedLogStreams,
      totalEvents: allEvents.length,
    };
  } catch (error) {
    console.error("Error fetching logs:", error);
    return {
      logGroupName: actualLogGroupName,
      events: [],
      message: "Error fetching logs from CloudWatch.",
    };
  }
}

async function getAgentLogsTail(agentId, lines = 50) {
  const cloudWatchLogs = new CloudWatchLogsClient({
    region: process.env.AWS_REGION,
  });

  // First, try to find the actual log group name by listing log groups with the agent prefix
  let actualLogGroupName = null;
  try {
    const listCommand = new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/apprunner/agent-${agentId}/`,
    });
    const listResponse = await cloudWatchLogs.send(listCommand);

    if (listResponse.logGroups && listResponse.logGroups.length > 0) {
      // Find the application log group (it should contain 'application' in the name)
      const appLogGroup = listResponse.logGroups.find((lg) =>
        lg.logGroupName.includes("/application")
      );
      if (appLogGroup) {
        actualLogGroupName = appLogGroup.logGroupName;
      }
    }
  } catch (error) {
    console.error("Error finding log group:", error);
  }

  if (!actualLogGroupName) {
    return {
      logGroupName: `/aws/apprunner/agent-${agentId}/application`,
      events: [],
      totalEvents: 0,
      message:
        "No logs found for this agent. The agent might not have started yet or no logs have been generated.",
      timestamp: new Date().toISOString(),
    };
  }

  const params = {
    logGroupName: actualLogGroupName,
    limit: lines,
    startFromHead: false, // Get most recent logs first
  };

  try {
    const command = new FilterLogEventsCommand(params);
    const response = await cloudWatchLogs.send(command);

    // Get the most recent events by paginating through results
    let allEvents = response.events || [];
    let nextToken = response.nextToken;

    // Continue fetching until we have enough events or reach the limit
    while (nextToken && allEvents.length < lines) {
      const nextParams = { ...params, nextToken };
      const nextCommand = new FilterLogEventsCommand(nextParams);
      const nextResponse = await cloudWatchLogs.send(nextCommand);

      allEvents = allEvents.concat(nextResponse.events || []);
      nextToken = nextResponse.nextToken;
    }

    // Keep only the most recent 'lines' number of events
    const recentEvents = allEvents.slice(0, lines);

    return {
      logGroupName: actualLogGroupName,
      events: recentEvents,
      totalEvents: recentEvents.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching log tail:", error);
    return {
      logGroupName: actualLogGroupName,
      events: [],
      totalEvents: 0,
      message: "Error fetching logs from CloudWatch.",
      timestamp: new Date().toISOString(),
    };
  }
}

async function listDeployedAgents() {
  const appRunner = new AppRunnerClient({ region: process.env.AWS_REGION });
  const cloudWatchLogs = new CloudWatchLogsClient({
    region: process.env.AWS_REGION,
  });

  try {
    // List all App Runner services
    const listCommand = new ListServicesCommand({});
    const servicesResponse = await appRunner.send(listCommand);

    const agents = [];

    for (const service of servicesResponse.ServiceSummaryList || []) {
      if (service.ServiceName.startsWith("agent-")) {
        const agentId = service.ServiceName.replace("agent-", "");

        // Check if logs exist for this agent by finding the actual log group
        let hasLogs = false;
        let actualLogGroupName = null;

        try {
          const describeLogGroupsCommand = new DescribeLogGroupsCommand({
            logGroupNamePrefix: `/aws/apprunner/agent-${agentId}/`,
          });
          const logGroupsResponse = await cloudWatchLogs.send(
            describeLogGroupsCommand
          );

          if (
            logGroupsResponse.logGroups &&
            logGroupsResponse.logGroups.length > 0
          ) {
            // Find the application log group
            const appLogGroup = logGroupsResponse.logGroups.find((lg) =>
              lg.logGroupName.includes("/application")
            );
            if (appLogGroup) {
              hasLogs = true;
              actualLogGroupName = appLogGroup.logGroupName;
            }
          }
        } catch (error) {
          // Log group doesn't exist or error occurred
          hasLogs = false;
        }

        agents.push({
          agentId,
          serviceName: service.ServiceName,
          serviceUrl: service.ServiceUrl,
          status: service.Status,
          createdAt: service.CreatedAt,
          hasLogs,
          logGroupName: actualLogGroupName,
        });
      }
    }

    return agents;
  } catch (error) {
    console.error("Error listing agents:", error);
    throw error;
  }
}

async function listAllLogGroups() {
  const cloudWatchLogs = new CloudWatchLogsClient({
    region: process.env.AWS_REGION,
  });

  try {
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: "/aws/apprunner/",
    });
    const response = await cloudWatchLogs.send(command);

    return response.logGroups || [];
  } catch (error) {
    console.error("Error listing log groups:", error);
    throw error;
  }
}

module.exports = {
  getAgentLogs,
  getAgentLogsTail,
  listDeployedAgents,
  listAllLogGroups,
};
