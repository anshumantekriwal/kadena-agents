require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const deployAgent = require("./deploy");

const app = express();
app.use(bodyParser.json());

app.post("/deploy-agent", async (req, res) => {
  const { agentId, baselineFunction, intervalFunction, publicKey, privateKey } =
    req.body;

  try {
    const agentUrl = await deployAgent({
      agentId,
      baselineFunction,
      intervalFunction,
      publicKey,
      privateKey,
    });
    res.status(200).json({ agentUrl });
  } catch (err) {
    console.error("Deployment error:", err);
    res.status(500).json({ error: "Failed to deploy agent." });
  }
});

app.get("/", (req, res) => res.send("Agent Deployer is live"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Deployer running on port ${PORT}`);
});
