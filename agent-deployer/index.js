require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const deployAgent = require("./deploy");
const {
  getAgentLogs,
  getAgentLogsTail,
  listDeployedAgents,
  listAllLogGroups,
} = require("./logs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API Key Auth Middleware
const API_KEY = process.env.API_KEY;
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  console.log(
    `🔐 [AUTH] ${req.method} ${req.path} - API Key provided: ${
      apiKey ? "Yes" : "No"
    }`
  );
  if (!apiKey || apiKey !== API_KEY) {
    console.log(`❌ [AUTH] ${req.method} ${req.path} - Authentication failed`);
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or missing API key." });
  }
  console.log(
    `✅ [AUTH] ${req.method} ${req.path} - Authentication successful`
  );
  next();
});

app.post("/deploy-agent", async (req, res) => {
  const { agentId, baselineFunction, intervalFunction, publicKey, privateKey } =
    req.body;

  console.log(`🚀 [DEPLOY] Starting deployment for agent: ${agentId}`);
  console.log(`📋 [DEPLOY] Agent details:`, {
    agentId,
    hasBaselineFunction: !!baselineFunction,
    hasIntervalFunction: !!intervalFunction,
    hasPublicKey: !!publicKey,
    hasPrivateKey: !!privateKey,
  });

  try {
    const agentUrl = await deployAgent({
      agentId,
      baselineFunction,
      intervalFunction,
      publicKey,
      privateKey,
    });
    console.log(
      `✅ [DEPLOY] Successfully deployed agent ${agentId} to: ${agentUrl}`
    );
    res.status(200).json({ agentUrl });
  } catch (err) {
    console.error(`❌ [DEPLOY] Failed to deploy agent ${agentId}:`, err);
    res.status(500).json({ error: "Failed to deploy agent." });
  }
});

app.get("/", (req, res) => {
  console.log(`🏠 [HEALTH] Health check request received`);
  res.send("Agent Deployer is live");
});

app.get("/agent-logs/:agentId", async (req, res) => {
  const { agentId } = req.params;
  const { startTime, endTime, limit = 100 } = req.query;

  console.log(`📊 [LOGS] Fetching logs for agent: ${agentId}`);
  console.log(`📋 [LOGS] Query parameters:`, { startTime, endTime, limit });

  try {
    const logs = await getAgentLogs(agentId, {
      startTime: startTime ? parseInt(startTime) : undefined,
      endTime: endTime ? parseInt(endTime) : undefined,
      limit: parseInt(limit),
    });

    console.log(
      `✅ [LOGS] Successfully retrieved ${
        logs.totalEvents || logs.events?.length || 0
      } log events for agent ${agentId}`
    );
    console.log(`📊 [LOGS] Log group: ${logs.logGroupName}`);

    res.status(200).json({ logs });
  } catch (err) {
    console.error(
      `❌ [LOGS] Failed to retrieve logs for agent ${agentId}:`,
      err
    );
    res.status(500).json({ error: "Failed to retrieve agent logs." });
  }
});

app.get("/agent-logs/:agentId/tail", async (req, res) => {
  const { agentId } = req.params;
  const { lines = 50 } = req.query;

  console.log(`📄 [TAIL] Fetching tail logs for agent: ${agentId}`);
  console.log(`📋 [TAIL] Requested lines: ${lines}`);

  try {
    const logs = await getAgentLogsTail(agentId, parseInt(lines));

    console.log(
      `✅ [TAIL] Successfully retrieved ${logs.totalEvents} recent log events for agent ${agentId}`
    );
    console.log(`📊 [TAIL] Log group: ${logs.logGroupName}`);
    console.log(`⏰ [TAIL] Response timestamp: ${logs.timestamp}`);

    res.status(200).json({ logs });
  } catch (err) {
    console.error(
      `❌ [TAIL] Failed to retrieve tail logs for agent ${agentId}:`,
      err
    );
    res.status(500).json({ error: "Failed to retrieve agent log tail." });
  }
});

app.get("/agent-logs/:agentId/all", async (req, res) => {
  const { agentId } = req.params;
  const { startTime, endTime, limit = 1000 } = req.query;

  console.log(`📚 [ALL] Fetching all logs for agent: ${agentId}`);
  console.log(`📋 [ALL] Query parameters:`, { startTime, endTime, limit });

  try {
    const logs = await getAgentLogs(agentId, {
      startTime: startTime ? parseInt(startTime) : undefined,
      endTime: endTime ? parseInt(endTime) : undefined,
      limit: parseInt(limit),
    });

    console.log(
      `✅ [ALL] Successfully retrieved ${
        logs.totalEvents || logs.events?.length || 0
      } log events for agent ${agentId}`
    );
    console.log(`📊 [ALL] Log group: ${logs.logGroupName}`);
    if (logs.nextToken) {
      console.log(`📄 [ALL] More logs available (nextToken present)`);
    }

    res.status(200).json({ logs });
  } catch (err) {
    console.error(
      `❌ [ALL] Failed to retrieve all logs for agent ${agentId}:`,
      err
    );
    res.status(500).json({ error: "Failed to retrieve agent logs." });
  }
});

app.get("/agents", async (req, res) => {
  console.log(`📋 [AGENTS] Fetching list of deployed agents`);

  try {
    const agents = await listDeployedAgents();

    console.log(
      `✅ [AGENTS] Successfully retrieved ${agents.length} deployed agents`
    );
    agents.forEach((agent) => {
      console.log(
        `📊 [AGENTS] Agent: ${agent.agentId} - Status: ${agent.status} - Has Logs: ${agent.hasLogs}`
      );
    });

    res.status(200).json({ agents });
  } catch (err) {
    console.error(`❌ [AGENTS] Failed to list deployed agents:`, err);
    res.status(500).json({ error: "Failed to list deployed agents." });
  }
});

app.get("/debug/log-groups", async (req, res) => {
  console.log(`🔍 [DEBUG] Fetching all log groups for debugging`);

  try {
    const logGroups = await listAllLogGroups();

    console.log(
      `✅ [DEBUG] Successfully retrieved ${logGroups.length} log groups`
    );
    logGroups.forEach((logGroup) => {
      console.log(`📊 [DEBUG] Log group: ${logGroup.logGroupName}`);
    });

    res.status(200).json({ logGroups });
  } catch (err) {
    console.error(`❌ [DEBUG] Failed to list log groups:`, err);
    res.status(500).json({ error: "Failed to list log groups." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [SERVER] Deployer running on port ${PORT}`);
  console.log(`🔐 [SERVER] API Key authentication enabled`);
  console.log(`📊 [SERVER] Log verbosity enabled for all endpoints`);
});
