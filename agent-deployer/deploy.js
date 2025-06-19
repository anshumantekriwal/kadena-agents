const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Docker = require("dockerode");
const {
  ECRClient,
  CreateRepositoryCommand,
  GetAuthorizationTokenCommand,
} = require("@aws-sdk/client-ecr");
const {
  AppRunnerClient,
  CreateServiceCommand,
} = require("@aws-sdk/client-apprunner");
const codeString = require("./constants");
const http = require("http");

const REGION = process.env.AWS_REGION;
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;

async function deployAgent({
  agentId,
  baselineFunction,
  intervalFunction,
  publicKey,
  privateKey,
}) {
  console.log(`🚀 Starting deployment for agent: ${agentId}`);
  console.log(`📍 Region: ${REGION}`);
  console.log(`🏢 Account ID: ${ACCOUNT_ID}`);

  // Validate required environment variables
  if (!REGION) {
    throw new Error("AWS_REGION environment variable is required");
  }
  if (!ACCOUNT_ID) {
    throw new Error("AWS_ACCOUNT_ID environment variable is required");
  }
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error("AWS_ACCESS_KEY_ID environment variable is required");
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS_SECRET_ACCESS_KEY environment variable is required");
  }

  console.log("✅ Environment variables validated");
  process.env.AGENT_PUBLIC_KEY = publicKey;
  process.env.AGENT_PRIVATE_KEY = privateKey;

  console.log("📁 Creating build directory...");
  const buildDir = path.join("/tmp", `agent-${agentId}`);
  fs.mkdirSync(buildDir, { recursive: true });
  console.log(`📂 Build directory created: ${buildDir}`);

  console.log("📝 Generating agent code...");
  const agentCode = `
${codeString}

// Fake HTTP server for App Runner health check
import http from 'http';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Agent is running');
});
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(\`Health check server running on port \${port}\`);
});

// User-defined baseline function
${baselineFunction}

// User-defined interval function  
${intervalFunction}

console.log("Agent started successfully - baseline and interval functions are active");
`;
  fs.writeFileSync(path.join(buildDir, "index.js"), agentCode);
  console.log("✅ Agent code generated and saved");

  console.log("📦 Creating package.json...");
  const packageJson = {
    name: `agent-${agentId}`,
    version: "1.0.0",
    type: "module",
    main: "index.js",
    scripts: { start: "node index.js" },
    dependencies: {
      "@kadena/client": "^1.17.1",
      "@kadena/hd-wallet": "^0.6.1",
      dotenv: "^16.5.0",
    },
  };
  fs.writeFileSync(
    path.join(buildDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
  console.log("✅ package.json created");

  console.log("🐳 Creating Dockerfile...");
  fs.writeFileSync(
    path.join(buildDir, "Dockerfile"),
    `
FROM node:22-alpine
WORKDIR /
COPY package.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
`
  );
  console.log("✅ Dockerfile created");

  const repoName = `agent-${agentId}`;
  const imageUri = `${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${repoName}:latest`;
  console.log(`🏗️  ECR Repository: ${repoName}`);
  console.log(`🖼️  Image URI: ${imageUri}`);

  // Create ECR repo
  console.log("🔧 Creating ECR repository...");
  const ecr = new ECRClient({ region: REGION });
  try {
    await ecr.send(new CreateRepositoryCommand({ repositoryName: repoName }));
    console.log("✅ ECR repository created");
  } catch (err) {
    if (!err.name.includes("RepositoryAlreadyExists")) {
      console.error("❌ Failed to create ECR repository:", err);
      throw err;
    }
    console.log("ℹ️  ECR repository already exists");
  }

  console.log("🐳 Initializing Docker...");
  const docker = new Docker();

  // Build image
  console.log("🔨 Building Docker image...");
  const tarStream = await docker.buildImage(
    {
      context: buildDir,
      src: ["Dockerfile", "index.js", "package.json"],
    },
    {
      t: imageUri,
      platform: "linux/amd64", // Force AMD64 for AWS compatibility
    }
  );

  console.log("⏳ Waiting for Docker build to complete...");
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(tarStream, (err, res) => {
      if (err) {
        console.error("❌ Docker build failed:", err);
        reject(err);
      } else {
        console.log("✅ Docker image built successfully");
        resolve(res);
      }
    });
  });

  // Fix issue 4: Proper ECR authentication
  console.log("🔐 Getting ECR authorization token...");
  const authTokenCommand = new GetAuthorizationTokenCommand({});
  const authTokenResponse = await ecr.send(authTokenCommand);
  const authToken = authTokenResponse.authorizationData[0].authorizationToken;
  const decodedToken = Buffer.from(authToken, "base64").toString("utf-8");
  const [username, password] = decodedToken.split(":");
  console.log("✅ ECR authorization token obtained");

  // Push image
  console.log("⬆️  Pushing Docker image to ECR...");
  const image = docker.getImage(imageUri);
  await image.push({
    authconfig: {
      username: username,
      password: password,
      serveraddress: `${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com`,
    },
  });
  console.log("✅ Docker image pushed to ECR");

  // Deploy to App Runner
  console.log("🚀 Deploying to AWS App Runner...");
  const appRunner = new AppRunnerClient({ region: REGION });

  const serviceConfig = {
    ServiceName: `agent-${agentId}`,
    SourceConfiguration: {
      ImageRepository: {
        ImageIdentifier: imageUri,
        ImageRepositoryType: "ECR",
        ImageConfiguration: {
          Port: "8080",
          RuntimeEnvironmentVariables: {
            API_KEY: process.env.API_KEY || "",
            PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY || "",
            PUBLIC_KEY: process.env.AGENT_PUBLIC_KEY || "",
            PASSWORD: process.env.PASSWORD || "",
          },
        },
      },
      AuthenticationConfiguration: {
        AccessRoleArn: `arn:aws:iam::${ACCOUNT_ID}:role/AppRunnerECRAccessRole`,
      },
      AutoDeploymentsEnabled: true,
    },
    InstanceConfiguration: {
      Cpu: "512",
      Memory: "1024",
    },
  };

  console.log(
    "📋 App Runner configuration:",
    JSON.stringify(serviceConfig, null, 2)
  );

  const createSvc = await appRunner.send(
    new CreateServiceCommand(serviceConfig)
  );

  const serviceUrl = createSvc.Service.ServiceUrl;
  console.log("🎉 Deployment completed successfully!");
  console.log(`🌐 Service URL: ${serviceUrl}`);
  console.log(`📊 Service ARN: ${createSvc.Service.ServiceArn}`);

  return serviceUrl;
}

module.exports = deployAgent;
