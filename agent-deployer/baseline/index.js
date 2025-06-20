import { Pact, createClient } from "@kadena/client";
import dotenv from "dotenv";
import { kadenaSignWithKeyPair } from "@kadena/hd-wallet";
// Custom error classes for better error handling
class KadenaError extends Error {
  constructor(message, code = "KADENA_ERROR", details = {}) {
    super(message);
    this.name = "KadenaError";
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends KadenaError {
  constructor(message, details = {}) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

class TransactionError extends KadenaError {
  constructor(message, details = {}) {
    super(message, "TRANSACTION_ERROR", details);
    this.name = "TransactionError";
  }
}

class AuthenticationError extends KadenaError {
  constructor(message, details = {}) {
    super(message, "AUTH_ERROR", details);
    this.name = "AuthenticationError";
  }
}

dotenv.config();

// API configuration
const API_BASE_URL = "https://kadena-agents.onrender.com";
let API_KEY = process.env.API_KEY;
const DATE = new Date().toISOString();

export const chainId = "2";
export const networkId = "mainnet01";
export const rpcUrl = `https://api.chainweb.com/chainweb/0.0/${networkId}/chain/${chainId}/pact`;

const client = createClient(rpcUrl);

// Constants
const NETWORK_ID = "mainnet01";

function setApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Invalid API key provided");
  }
  API_KEY = apiKey;
}

async function makeRequest(endpoint, body) {
  try {
    if (!API_KEY) {
      throw new AuthenticationError("API key is not set", {
        endpoint,
        suggestion: "Set API_KEY environment variable or call setApiKey()",
      });
    }

    if (!endpoint || typeof endpoint !== "string") {
      throw new ValidationError("Invalid endpoint provided", {
        endpoint,
        expectedType: "string",
        receivedType: typeof endpoint,
      });
    }

    if (!body || typeof body !== "object") {
      throw new ValidationError("Invalid request body", {
        expectedType: "object",
        receivedType: typeof body,
      });
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(body),
    });

    let errorData;
    if (!response.ok) {
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: "Unknown error", parseError: e.message };
      }

      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        errorData,
      };

      switch (response.status) {
        case 401:
        case 403:
          throw new AuthenticationError("Authentication failed", errorDetails);
        case 400:
          throw new ValidationError("Invalid request parameters", errorDetails);
        case 404:
          throw new KadenaError(
            "Resource not found",
            "NOT_FOUND_ERROR",
            errorDetails
          );
        case 429:
          throw new KadenaError(
            "Rate limit exceeded",
            "RATE_LIMIT_ERROR",
            errorDetails
          );
        default:
          throw new KadenaError(
            `API Error (${response.status}): ${
              errorData.error || response.statusText
            }`,
            "API_ERROR",
            errorDetails
          );
      }
    }

    return await response.json();
  } catch (error) {
    if (error instanceof KadenaError) {
      throw error;
    }

    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new KadenaError(
        "Network error: Unable to reach API",
        "NETWORK_ERROR",
        {
          originalError: error.message,
          endpoint,
        }
      );
    }

    throw new KadenaError(`Request failed: ${error.message}`, "REQUEST_ERROR", {
      originalError: error.message,
      endpoint,
      body,
    });
  }
}

function validateChainId(chainId) {
  const chainIdStr = String(chainId);
  const chainIdNum = parseInt(chainIdStr, 10);

  if (isNaN(chainIdNum) || chainIdNum < 0 || chainIdNum > 19) {
    throw new Error("Chain ID must be between 0 and 19");
  }

  return chainIdStr;
}

async function transfer({
  tokenAddress,
  sender,
  receiver,
  amount,
  chainId,
  meta,
  gasLimit,
  gasPrice,
  ttl,
}) {
  if (!tokenAddress) throw new Error("tokenAddress is required");
  if (!sender) throw new Error("sender is required");
  if (!receiver) throw new Error("receiver is required");
  if (amount === undefined || amount === null)
    throw new Error("amount is required");

  const validatedChainId = validateChainId(chainId);

  const requestBody = {
    tokenAddress,
    sender,
    receiver,
    amount: String(amount),
    chainId: validatedChainId,
  };

  if (meta !== undefined) requestBody.meta = meta;
  if (gasLimit !== undefined) requestBody.gasLimit = gasLimit;
  if (gasPrice !== undefined) requestBody.gasPrice = gasPrice;
  if (ttl !== undefined) requestBody.ttl = ttl;

  return await makeRequest("/transfer", requestBody);
}

async function swap({
  tokenInAddress,
  tokenOutAddress,
  account,
  chainId,
  amountIn,
  amountOut,
  slippage,
}) {
  if (!tokenInAddress) throw new Error("tokenInAddress is required");
  if (!tokenOutAddress) throw new Error("tokenOutAddress is required");
  if (!account) throw new Error("account is required");

  if (amountIn === undefined && amountOut === undefined) {
    throw new Error("Either amountIn or amountOut must be provided");
  }
  if (amountIn !== undefined && amountOut !== undefined) {
    throw new Error("Cannot specify both amountIn and amountOut");
  }

  const validatedChainId = validateChainId(chainId);

  const requestBody = {
    tokenInAddress,
    tokenOutAddress,
    account,
    chainId: validatedChainId,
  };

  if (amountIn !== undefined) requestBody.amountIn = String(amountIn);
  if (amountOut !== undefined) requestBody.amountOut = String(amountOut);
  if (slippage !== undefined) requestBody.slippage = slippage;

  return await makeRequest("/swap", requestBody);
}

async function quote({
  tokenInAddress,
  tokenOutAddress,
  chainId,
  amountIn,
  amountOut,
}) {
  if (!tokenInAddress) throw new Error("tokenInAddress is required");
  if (!tokenOutAddress) throw new Error("tokenOutAddress is required");

  if (amountIn === undefined && amountOut === undefined) {
    throw new Error("Either amountIn or amountOut must be provided");
  }
  if (amountIn !== undefined && amountOut !== undefined) {
    throw new Error("Cannot specify both amountIn and amountOut");
  }

  const validatedChainId = validateChainId(chainId);

  const requestBody = {
    tokenInAddress,
    tokenOutAddress,
    chainId: validatedChainId,
  };

  if (amountIn !== undefined) requestBody.amountIn = String(amountIn);
  if (amountOut !== undefined) requestBody.amountOut = String(amountOut);

  return await makeRequest("/quote", requestBody);
}

// Original baseline.js functions with reduced comments

async function getKeys() {
  try {
    if (!process.env.PRIVATE_KEY) {
      throw new AuthenticationError(
        "PRIVATE_KEY environment variable is not set",
        {
          suggestion: "Add PRIVATE_KEY to your .env file",
        }
      );
    }

    if (!process.env.PUBLIC_KEY) {
      throw new AuthenticationError(
        "PUBLIC_KEY environment variable is not set",
        {
          suggestion: "Add PUBLIC_KEY to your .env file",
        }
      );
    }

    const privateKey = process.env.PRIVATE_KEY;
    const publicKey = process.env.PUBLIC_KEY;

    return {
      secretKey: privateKey,
      publicKey: publicKey,
    };
  } catch (error) {
    if (error instanceof KadenaError) {
      throw error;
    }
    throw new AuthenticationError(`Failed to retrieve keys: ${error.message}`, {
      originalError: error.message,
    });
  }
}

async function signTransaction(transaction, keyPair) {
  try {
    if (!transaction) {
      throw new ValidationError("Transaction is required", {
        suggestion: "Provide a valid transaction object or string",
      });
    }

    if (!keyPair || !keyPair.secretKey || !keyPair.publicKey) {
      throw new ValidationError("Invalid key pair provided", {
        expectedFormat: "Object with secretKey and publicKey properties",
        received: keyPair ? Object.keys(keyPair) : typeof keyPair,
      });
    }

    if (!transaction.hash) {
      throw new ValidationError("Transaction hash is missing", {
        transaction:
          typeof transaction === "object"
            ? Object.keys(transaction)
            : typeof transaction,
      });
    }

    const txString =
      typeof transaction === "string"
        ? transaction
        : JSON.stringify(transaction);

    try {
      const password = process.env.PASSWORD;
      const signFn = kadenaSignWithKeyPair(
        password,
        keyPair.publicKey,
        keyPair.secretKey
      );
      const signature = await signFn(transaction.hash);
      return signature;
    } catch (signError) {
      throw new TransactionError("Failed to sign transaction", {
        originalError: signError.message,
        transactionHash: transaction.hash,
      });
    }
  } catch (error) {
    if (error instanceof KadenaError) {
      throw error;
    }
    throw new TransactionError(`Failed to sign transaction: ${error.message}`, {
      originalError: error.message,
    });
  }
}

async function submitTransaction(signedTransaction) {
  try {
    if (!signedTransaction) {
      throw new ValidationError("Signed transaction is required", {
        suggestion: "Provide a valid signed transaction object",
      });
    }

    if (!signedTransaction.hash) {
      throw new ValidationError("Transaction hash is missing", {
        transaction:
          typeof signedTransaction === "object"
            ? Object.keys(signedTransaction)
            : typeof signedTransaction,
      });
    }

    console.log(
      "Submitting transaction to Kadena blockchain:",
      signedTransaction
    );

    let transactionDescriptor;
    try {
      transactionDescriptor = await client.submit(signedTransaction);
    } catch (submitError) {
      throw new TransactionError("Failed to submit transaction", {
        originalError: submitError.message,
        transactionHash: signedTransaction.hash,
      });
    }

    console.log("Transaction descriptor:", transactionDescriptor);

    let response;
    try {
      response = await client.listen(transactionDescriptor);
    } catch (listenError) {
      throw new TransactionError("Failed to listen for transaction result", {
        originalError: listenError.message,
        requestKey: transactionDescriptor.requestKey,
      });
    }

    console.log("Transaction response:", response);

    if (response.result.status === "success") {
      return {
        requestKey: transactionDescriptor.requestKey,
        hash: signedTransaction.hash,
        status: "success",
        result: response.result.data,
      };
    } else {
      let errorMessage = "Transaction failed";
      let errorDetails = {};

      if (response.result.error) {
        if (typeof response.result.error === "string") {
          errorMessage = response.result.error;
        } else {
          try {
            errorMessage = JSON.stringify(response.result.error);
            errorDetails = response.result.error;
          } catch (e) {
            errorMessage = `Transaction failed: ${
              response.result.error.message || "Unknown error"
            }`;
            errorDetails = { parseError: e.message };
          }
        }
      }

      throw new TransactionError(errorMessage, {
        requestKey: transactionDescriptor.requestKey,
        hash: signedTransaction.hash,
        status: "failure",
        error: errorDetails,
        rawResponse: response.result,
      });
    }
  } catch (error) {
    if (error instanceof KadenaError) {
      throw error;
    }
    throw new TransactionError(
      `Failed to submit transaction: ${error.message}`,
      {
        originalError: error.message,
        transaction: signedTransaction,
      }
    );
  }
}

async function getBalance(accountName, chainId, tokenName = "coin") {
  try {
    const moduleAndFunction = `(${tokenName}.get-balance "${accountName}")`;

    const transaction = Pact.builder
      .execution(moduleAndFunction)
      .setMeta({ chainId })
      .setNetworkId(NETWORK_ID)
      .createTransaction();

    const response = await client.dirtyRead(transaction);

    if (response.result.status === "success") {
      const balance = response.result.data;
      return typeof balance === "object" && balance.decimal
        ? parseFloat(balance.decimal)
        : balance;
    }
    return 0;
  } catch (error) {
    console.error(`Failed to get ${tokenName} balance:`, error);
    return 0;
  }
}

async function getBalances(accountName, chainId = "2") {
  try {
    if (!accountName) {
      throw new ValidationError("Account name is required", {
        suggestion: "Provide a valid Kadena account name",
      });
    }

    const validatedChainId = validateChainId(chainId);

    // Complete list of all available tokens with categorization
    const tokens = {
      native: ["coin"],
      major: [
        "arkade.token",
        "kaddex.kdx",
        "kdlaunch.token",
        "kdlaunch.kdswap-token",
        "n_b742b4e9c600892af545afb408326e82a6c0c6ed.zUSD",
      ],
      free: [
        "free.maga",
        "free.crankk01",
        "free.cyberfly_token",
        "free.finux",
        "free.kishu-ken",
        "free.wiza",
        "free.babena",
      ],
      named: [
        "n_625e9938ae84bdb7d190f14fc283c7a6dfc15d58.ktoshi",
        "n_e309f0fa7cf3a13f93a8da5325cdad32790d2070.heron",
        "n_582fed11af00dc626812cd7890bb88e72067f28c.bro",
        "n_2669414de420c0d40bbc3caa615e989eaba83d6f.highlander",
        "n_c89f6bb915bf2eddf7683fdea9e40691c840f2b6.cwc",
        "n_d8d407d0445ed92ba102c2ce678591d69e464006.TRILLIONCARBON",
        "n_518dfea5f0d2abe95cbcd8956eb97f3238e274a9.AZUKI",
        "n_71c27e6720665fb572433c8e52eb89833b47b49b.Peppapig",
      ],
      platform: ["hypercent.prod-hype-coin", "runonflux.flux"],
    };

    // Blacklisted tokens
    const blacklist = [
      "lago.USD2",
      "lago.kwBTC",
      "lago.kwUSDC",
      "free.elon",
      "mok.token",
      "free.docu",
      "free.kpepe",
      "free.backalley",
      "free.kapybara-token",
      "free.jodie-token",
      "free.corona-token",
      "free.KAYC",
      "free.anedak",
    ];

    // Flatten and filter tokens
    const validTokens = Object.values(tokens)
      .flat()
      .filter((token) => !blacklist.includes(token));

    const balances = {};
    const errors = [];

    // Get balances for all valid tokens
    for (const token of validTokens) {
      try {
        const balance = await getBalance(accountName, validatedChainId, token);
        if (balance > 0) {
          balances[token] = balance.toString();
        }
      } catch (error) {
        errors.push({
          token,
          error: error.message,
        });
        console.error(`Error getting balance for ${token}:`, error);
        continue;
      }
    }

    // If we have errors but also some successful balances, return both
    if (errors.length > 0) {
      return {
        balances,
        errors,
        status: "partial",
        message: `Retrieved ${Object.keys(balances).length} balances with ${
          errors.length
        } errors`,
      };
    }

    // If we have no balances and all errors, throw an error
    if (Object.keys(balances).length === 0 && errors.length > 0) {
      throw new KadenaError(
        "Failed to retrieve any balances",
        "BALANCE_ERROR",
        {
          errors,
          suggestion: "Check account name and chain ID",
        }
      );
    }

    return balances;
  } catch (error) {
    if (error instanceof KadenaError) {
      throw error;
    }
    throw new KadenaError(
      `Error getting balances: ${error.message}`,
      "BALANCE_ERROR",
      {
        originalError: error.message,
        accountName,
        chainId,
      }
    );
  }
}

// baselineFunction
async function baselineFunction() {
  try {
    // 1. Retrieve keys from KMS
    console.log("Retrieving keys...");
    const keyPair = await getKeys();
    console.log("Keys retrieved successfully");

    // 2. Load current balances
    const balances = await getBalances("k:" + keyPair.publicKey);
    console.log(balances);

    // 3. Create transaction (DCA swap)
    console.log("Creating transaction...");

    // ENTER AI CODE HERE
    const account = "k:" + keyPair.publicKey;
    const kdaBalance = parseFloat(balances.coin || "0");
    if (kdaBalance <= 0) {
      console.log("No KDA balance left, skipping swap.");
      return null;
    }
    const amountOut = "0.0001"; // zUSD
    const tokenIn = "coin"; // KDA
    const tokenOut = "n_b742b4e9c600892af545afb408326e82a6c0c6ed.zUSD";
    let transaction = await swap({
      tokenInAddress: tokenIn,
      tokenOutAddress: tokenOut,
      account,
      chainId,
      amountOut,
      slippage: 0.005,
    });
    // END AI CODE

    console.log("Transaction created:", transaction);

    if (transaction["transaction"]) {
      transaction = transaction["transaction"];
    }

    // 4. Sign the transaction
    console.log("Signing transaction...");
    const signature = await signTransaction(transaction, keyPair);
    console.log("Transaction signed successfully");
    console.log("Signature:", signature);

    const signedTransaction = {
      cmd: transaction.cmd,
      hash: transaction.hash,
      sigs: [signature],
    };

    // 5. Submit the transaction
    console.log("Submitting transaction...");
    const result = await submitTransaction(signedTransaction);
    console.log("Transaction submitted successfully:", result);

    return result;
  } catch (error) {
    console.error("Error in baseline function:", error);
    throw error;
  }
}

// intervalFunction
const checkSchedule = () => {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  // Convert UTC to IST (UTC+5:30)
  const totalMinutes = utcH * 60 + utcM + 5 * 60 + 30;
  const istH = Math.floor(totalMinutes / 60) % 24;
  const istM = totalMinutes % 60;
  if (istH === 2 && istM === 20) {
    console.log("It's 2:20 AM IST, running baselineFunction");
    baselineFunction();
  } else {
    console.log(`Not 2:20 AM IST yet. Current IST time: ${istH}:${istM}`);
  }
};

setInterval(checkSchedule, 60000);
