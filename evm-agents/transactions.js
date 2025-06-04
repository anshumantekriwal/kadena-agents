/**
 * @description JavaScript client for LiFi API operations
 *
 * This module provides functions to interact with the LiFi API,
 * allowing cross-chain token swaps and price quotes.
 */

require("dotenv").config();

const axios = require("axios");
const LIFI_API_KEY = process.env.LIFI_API_KEY;
const LIFI_API_URL = "https://li.quest/v1";

/**
 * Makes a request to the LiFi API
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} params - The parameters for the request
 * @returns {Promise<Object>} The API response
 * @private
 */
async function makeRequest(endpoint, params) {
  try {
    const headers = {
      Accept: "application/json",
      "x-lifi-api-key": LIFI_API_KEY,
    };

    // Map internal parameter names to API parameter names
    const paramMap = {
      fromChainId: "fromChain",
      toChainId: "toChain",
      fromTokenAddress: "fromToken",
      toTokenAddress: "toToken",
    };

    // Use GET with query parameters instead of POST with body
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      // Map the parameter name if needed
      const apiKey = paramMap[key] || key;
      queryParams.append(apiKey, value);
    }

    const url = `${LIFI_API_URL}${endpoint}?${queryParams.toString()}`;
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error in makeRequest for ${endpoint}:`, error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
}

/**
 * Get a quote for swapping tokens across chains
 *
 * @param {Object} params - Quote parameters
 * @param {string|number} params.fromChainId - Source chain ID
 * @param {string} params.fromTokenAddress - Source token address
 * @param {string|number} params.toChainId - Destination chain ID
 * @param {string} params.toTokenAddress - Destination token address
 * @param {string} params.fromAmount - Amount to swap (in smallest unit)
 * @param {string} params.fromAddress - Sender address
 * @param {number} [params.slippage] - Slippage tolerance in percentage (default: 0.5)
 * @param {string} [params.integrator] - Integrator identifier for fee sharing
 * @param {string} [params.fee] - Fee amount to be taken by the integrator
 * @returns {Promise<Object>} Quote response containing:
 *   - routes: Array of possible routes for the swap
 *   - estimate: Object containing estimated gas costs and times
 */
async function getQuote({
  fromChainId,
  fromTokenAddress,
  toChainId,
  toTokenAddress,
  fromAmount,
  fromAddress,
  slippage = 0.5,
  integrator = "xade-finance",
  fee = "0",
}) {
  const body = {
    fromChainId,
    fromTokenAddress,
    toChainId,
    toTokenAddress,
    fromAmount,
    fromAddress,
    slippage,
    integrator,
    fee,
  };

  return makeRequest("/quote", body);
}

/**
 * Execute a token swap across chains
 *
 * @param {Object} params - Swap parameters
 * @param {string|number} params.fromChainId - Source chain ID
 * @param {string} params.fromTokenAddress - Source token address
 * @param {string|number} params.toChainId - Destination chain ID
 * @param {string} params.toTokenAddress - Destination token address
 * @param {string} params.fromAmount - Amount to swap (in smallest unit)
 * @param {string} params.fromAddress - Sender address
 * @param {number} params.slippage - Slippage tolerance in percentage
 * @param {string} [params.integrator] - Integrator identifier for fee sharing
 * @param {string} [params.fee] - Fee amount to be taken by the integrator
 * @param {string} [params.referrer] - Referrer address for fee sharing
 * @returns {Promise<Object>} Swap transaction data containing:
 *   - transactionRequest: Object containing transaction details
 *   - estimate: Object containing estimated costs and times
 *   - includedSteps: Array of steps involved in the transaction
 */
async function executeSwap({
  fromChainId,
  fromTokenAddress,
  toChainId,
  toTokenAddress,
  fromAmount,
  fromAddress,
  slippage,
  fee = "0",
  referrer = "",
}) {
  const body = {
    fromChainId,
    fromTokenAddress,
    toChainId,
    toTokenAddress,
    fromAmount,
    fromAddress,
    slippage,
    fee,
  };

  if (referrer) {
    body.referrer = referrer;
  }

  return makeRequest("/swap", body);
}

/**
 * Get the status of a transaction
 *
 * @param {Object} params - Parameters
 * @param {string} params.txHash - Transaction hash
 * @param {string|number} params.chainId - Chain ID where the transaction was executed
 * @returns {Promise<Object>} Status of the transaction (PENDING, COMPLETED, FAILED)
 */
async function getStatus({ txHash, chainId }) {
  try {
    const url = `${LIFI_API_URL}/status?txHash=${txHash}&chainId=${chainId}`;
    const headers = {
      Accept: "application/json",
      "x-lifi-api-key": LIFI_API_KEY,
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(
      `Error in getStatus for transaction ${txHash}:`,
      error.message
    );
    throw error;
  }
}

// Helper function to convert token amount to smallest unit
function toSmallestUnit(amount, decimals) {
  return BigInt(Math.floor(amount * 10 ** decimals)).toString();
}

// Helper function to convert from smallest unit to token amount
function fromSmallestUnit(amount, decimals) {
  return Number(amount) / 10 ** decimals;
}

/**
 * Convert token amount between human-readable and contract units
 * @param {Object} params - Conversion parameters
 * @param {string} params.amount - Amount to convert
 * @param {number} params.decimals - Token decimals
 * @param {boolean} params.toWei - Convert to smallest unit (true) or from smallest unit (false)
 * @returns {string} Converted amount as string
 */
async function convertAmount({ amount, decimals, toWei }) {
  if (toWei) {
    return toSmallestUnit(parseFloat(amount), decimals);
  } else {
    return fromSmallestUnit(amount, decimals).toString();
  }
}

/**
 * Get a list of all supported chains
 * @returns {Promise<Object>} List of supported chains with details
 */
async function getChains() {
  try {
    const url = `${LIFI_API_URL}/chains`;
    const headers = {
      Accept: "application/json",
      "x-lifi-api-key": LIFI_API_KEY,
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error in getChains:`, error.message);
    throw error;
  }
}

/**
 * Get a list of all supported tokens
 * @param {Object} params - Parameters
 * @param {string|number} [params.chainId] - Chain ID to filter tokens (optional)
 * @returns {Promise<Object>} List of supported tokens with details
 */
async function getTokens({ chainId } = {}) {
  try {
    const url = chainId
      ? `${LIFI_API_URL}/tokens?chainId=${chainId}`
      : `${LIFI_API_URL}/tokens`;

    const headers = {
      Accept: "application/json",
      "x-lifi-api-key": LIFI_API_KEY,
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error in getTokens:`, error.message);
    throw error;
  }
}

module.exports = {
  getQuote,
  executeSwap,
  getChains,
  getTokens,
  getStatus,
  toSmallestUnit,
  fromSmallestUnit,
  convertAmount,
};
