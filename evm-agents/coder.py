import os
import json
import requests
from typing import Dict, List, Any, Optional, Union, Tuple

# LangChain imports
from langchain.agents import Tool, AgentExecutor, create_openai_functions_agent
from langchain.memory import ConversationBufferMemory
from langchain.schema import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
# Set your OpenAI API key
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variables
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

TRANSACTIONS_CODE = """
/**
 * @description JavaScript client for LiFi API operations on EVM chains
 * 
 * This module provides functions to interact with multiple EVM chains through the LiFi API,
 * allowing token transfers, swaps, and cross-chain operations.
 */

/**
 * Get information about all supported chains
 * @returns {Promise<Array>} Array of supported chain objects containing:
 *   - id: The chain ID (number)
 *   - key: The chain key (string, e.g. 'eth')
 *   - name: The chain name (string, e.g. 'Ethereum')
 *   - logoURI: URL to the chain logo
 *   - isTestnet: Boolean indicating if it's a testnet
 */
async function getChains()

/**
 * Get all tokens for a specific chain
 * @param {Object} params - Token parameters
 * @param {number} params.chainId - Chain ID of the EVM network
 * @returns {Promise<Array>} Array of token objects containing:
 *   - address: Token contract address
 *   - symbol: Token symbol
 *   - decimals: Token decimals
 *   - name: Token name
 *   - chainId: Chain ID where the token exists
 *   - logoURI: URL to the token logo
 *   - priceUSD: Current price in USD (if available)
 */
async function getTokens({ chainId })

/**
 * Get a quote for swapping tokens across chains
 * @param {Object} params - Quote parameters
 * @param {number} params.fromChain - Source chain ID
 * @param {string} params.fromTokenAddress - Source token address
 * @param {number} params.toChainId - Destination chain ID
 * @param {string} params.toTokenAddress - Destination token address
 * @param {string} params.fromAmount - Amount to swap in token's smallest unit
 * @param {string} [params.fromAddress] - Sender's address
 * @param {number} [params.slippage] - Maximum acceptable slippage as percentage (e.g., 0.5 for 0.5%)
 * @param {string} [params.integrator] - Integrator identifier
 * @param {number} [params.fee] - Fee percentage for integrator
 * @param {Array<string>} [params.allowBridges] - Allowed bridge services
 * @param {Array<string>} [params.allowExchanges] - Allowed exchange services
 * @param {Array<string>} [params.allowDexes] - Allowed DEXes
 * @returns {Promise<Object>} Quote object containing:
 *   - id: Quote ID
 *   - type: Quote type
 *   - tool: Tool used for the quote
 *   - action: Action details
 *   - estimate: Estimated amounts and times
 *   - includedSteps: Steps involved in the swap
 *   - transactionRequest: Transaction details for execution
 */
async function getQuote({
  fromChain,
  fromTokenAddress,
  toChainId,
  toTokenAddress,
  fromAmount,
  fromAddress,
  slippage,
  integrator,
  fee,
  allowBridges,
  allowExchanges,
  allowDexes
})

/**
 * Execute a token swap across chains
 * @param {Object} params - Swap parameters
 * @param {number} params.fromChain - Source chain ID
 * @param {string} params.fromTokenAddress - Source token address
 * @param {number} params.toChainId - Destination chain ID
 * @param {string} params.toTokenAddress - Destination token address
 * @param {string} params.fromAmount - Amount to swap in token's smallest unit
 * @param {string} params.fromAddress - Sender's address
 * @param {number} [params.slippage] - Maximum acceptable slippage as percentage
 * @param {string} [params.integrator] - Integrator identifier
 * @param {number} [params.fee] - Fee percentage for integrator
 * @param {Array<string>} [params.allowBridges] - Allowed bridge services
 * @param {Array<string>} [params.allowExchanges] - Allowed exchange services
 * @param {Array<string>} [params.allowDexes] - Allowed DEXes
 * @returns {Promise<Object>} Swap execution details containing:
 *   - transactionHash: Hash of the executed transaction
 *   - status: Status of the transaction
 *   - fromChain: Source chain ID
 *   - toChainId: Destination chain ID
 *   - fromAmount: Amount sent
 *   - toAmount: Amount received (estimated)
 *   - steps: Steps involved in the swap
 */
async function executeSwap({
  fromChain,
  fromTokenAddress,
  toChainId,
  toTokenAddress,
  fromAmount,
  fromAddress,
  slippage,
  integrator,
  fee,
  allowBridges,
  allowExchanges,
  allowDexes
})

/**
 * Get the status of a transaction
 * @param {Object} params - Status parameters
 * @param {string} params.txHash - Transaction hash
 * @param {number} params.chainId - Chain ID where the transaction was submitted
 * @param {string} [params.bridge] - Bridge used for the transaction
 * @returns {Promise<Object>} Status object containing details about the transaction
 */
async function getStatus({
  txHash,
  chainId,
  bridge
})

/**
 * Convert token amount between human-readable and contract units
 * @param {Object} params - Conversion parameters
 * @param {string} params.amount - Amount to convert
 * @param {number} params.decimals - Token decimals
 * @param {boolean} params.toWei - Convert to smallest unit (true) or from smallest unit (false)
 * @returns {string} Converted amount as string
 */
async function convertAmount({
  amount,
  decimals,
  toWei
})
"""

TRANSACTIONS_USAGE = """
// Example 1: Get all supported chains
try {
  const chains = await getChains();
  console.log('Supported chains:', chains);
} catch (error) {
  console.error('Failed to get chains:', error.message);
}

// Example 2: Get all tokens for Ethereum
try {
  const tokens = await getTokens({ chainId: 1 });
  console.log('Ethereum tokens:', tokens);
} catch (error) {
  console.error('Failed to get tokens:', error.message);
}

// Example 3: Get a quote for swapping ETH to USDC on Ethereum
try {
  const quote = await getQuote({
    fromChain: 1,
    fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
    toChainId: 1,
    toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    fromAmount: '1000000000000000000', // 1 ETH in wei
    slippage: 0.5 // 0.5% slippage
  });
  console.log('Swap quote:', quote);
} catch (error) {
  console.error('Failed to get quote:', error.message);
}

// Example 4: Execute a cross-chain swap from ETH on Ethereum to USDC on Polygon
try {
  const result = await executeSwap({
    fromChain: 1,
    fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
    toChainId: 137,
    toTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    fromAmount: '500000000000000000', // 0.5 ETH in wei
    fromAddress: '0xYourWalletAddress',
    slippage: 1 // 1% slippage
  });
  console.log('Swap executed:', result);
} catch (error) {
  console.error('Failed to execute swap:', error.message);
}

// Example 5: Check the status of a cross-chain transaction
try {
  const status = await getStatus({
    txHash: '0xTransactionHash',
    chainId: 1,
    bridge: 'stargate'
  });
  console.log('Transaction status:', status);
} catch (error) {
  console.error('Failed to get status:', error.message);
}

// Example 6: Convert token amount
try {
  const amountInWei = await convertAmount({
    amount: '1.5',
    decimals: 18,
    toWei: true
  });
  console.log('Amount in wei:', amountInWei); // 1500000000000000000
  
  const amountInEth = await convertAmount({
    amount: '1500000000000000000',
    decimals: 18,
    toWei: false
  });
  console.log('Amount in ETH:', amountInEth); // 1.5
} catch (error) {
  console.error('Failed to convert amount:', error.message);
}
"""

# Common EVM tokens across different chains
TOKENS = """
ethereum: # Chain ID: 1
  - symbol: ETH
    name: Ethereum
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
  - symbol: WETH
    name: Wrapped Ethereum
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png"
  - symbol: USDC
    name: USD Coin
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
  - symbol: USDT
    name: Tether USD
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png"
  - symbol: DAI
    name: Dai Stablecoin
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/9956/small/4943.png"
  - symbol: WBTC
    name: Wrapped Bitcoin
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
    decimals: 8
    logoURI: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png"

polygon: # Chain ID: 137
  - symbol: MATIC
    name: Polygon
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png"
  - symbol: WMATIC
    name: Wrapped Matic
    address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png"
  - symbol: USDC
    name: USD Coin
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
  - symbol: USDT
    name: Tether USD
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png"

arbitrum: # Chain ID: 42161
  - symbol: ETH
    name: Ethereum
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
  - symbol: WETH
    name: Wrapped Ethereum
    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png"
  - symbol: USDC
    name: USD Coin
    address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
  - symbol: USDT
    name: Tether USD
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png"

optimism: # Chain ID: 10
  - symbol: ETH
    name: Ethereum
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
  - symbol: WETH
    name: Wrapped Ethereum
    address: "0x4200000000000000000000000000000000000006"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png"
  - symbol: USDC
    name: USD Coin
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
  - symbol: USDT
    name: Tether USD
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png"

base: # Chain ID: 8453
  - symbol: ETH
    name: Ethereum
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
  - symbol: WETH
    name: Wrapped Ethereum
    address: "0x4200000000000000000000000000000000000006"
    decimals: 18
    logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png"
  - symbol: USDbC
    name: USD Base Coin
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA"
    decimals: 6
    logoURI: "https://assets.coingecko.com/coins/images/31272/small/usdbc.png"
"""

BASELINE_JS = """
[CODE]
// Baseline function for EVM blockchain transactions using LiFi
// This code provides the infrastructure for:
// 1. Retrieving wallet information
// 2. Transaction signing with ethers.js
// 3. Transaction submission via LiFi
// The AI model should focus on implementing the transaction creation logic. The LiFi functions will be pre-defined.

const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Main baseline function that orchestrates the entire process
 */
async function baselineFunction() {
  try {
    // 1. Initialize wallet
    console.log("Initializing wallet...");
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const walletAddress = await wallet.getAddress();
    console.log("Wallet initialized:", walletAddress);

    // 2. Load current balances
    console.log("Loading balances...");
    const balances = await getBalances(walletAddress);
    console.log("Current balances:", balances);

    // 3. Create transaction (placeholder)
    console.log("Creating transaction...");

    // ENTER AI CODE HERE
    // END AI CODE

    console.log("Transaction created:", transaction);

    // 4. Execute the transaction
    console.log("Executing transaction...");
    const result = await executeTransaction(transaction, wallet);
    console.log("Transaction executed successfully:", result);

    return result;
  } catch (error) {
    console.error("Error in baseline function:", error);
    throw error;
  }
}

// Helper function to get token balances
async function getBalances(address) {
  // Implementation details hidden - this will return balances in the format:
  // {
  //   '1': { // Chain ID
  //     '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': '1.23', // ETH
  //     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '100.50' // USDC
  //   },
  //   '137': { // Polygon Chain ID
  //     '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': '50.75', // MATIC
  //     '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': '200.25' // USDC
  //   }
  // }
  return mockBalances;
}

// Helper function to execute transaction with LiFi
async function executeTransaction(transaction, wallet) {
  // Implementation details hidden - this will execute the transaction with LiFi
  // and return the result
  return mockResult;
}
[/CODE]
"""

def code(prompt: str) -> Dict[str, Any]:
    """
    Generate code for a trading agent based on the provided prompt.
    
    Args:
        prompt: The trading agent prompt to generate code for
        
    Returns:
        Dict containing the generated code and execution interval
    """
    model = ChatOpenAI(model="o4-mini")

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """
        You are <Agent EVM>, a trading agent launcher created by Xade for EVM chains.

        Your task is to generate code to run on a serverless function to execute a user's trading positions across various EVM chains using the LiFi protocol.
        You will be writing code in JavaScript.
        
        You will be provided with a prompt containing all the information required to handle and execute the trading position.
        You will be provided with the user's wallet address and balances across different chains and tokens.
        You will have access to all the functions you need to achieve this task.

        Here are some resources to help you in your task:
        1. Transactions Documentation:
            {TRANSACTIONS_CODE}
            This snippet contains the docstring of functions to call the LiFi API. 
            These functions will be pre-defined. You need to use them to generate transactions.
        2. Transactions Usage:
            {TRANSACTIONS_USAGE}
            This contains examples to call/access the various endpoints of the LiFi API.
        3. Documentation for Tokens:
            {TOKENS}
            This documentation contains information about common tokens on different EVM chains.

        When a user prompt arrives:
        1. Analyze requirements:
        - Use the TOKENS documentation to validate any symbols or tokens that the user provides.
        - Use the TRANSACTIONS CODE to understand the required functions and parameters.
        - Analyze the user's prompt to understand the steps required to execute the trading position.
        - Create a step-by-step plan to execute the trading position.
        2. Generate code:
        - Create a function for each step in the plan.
        - Hardcode all the parameters for each function based on the requirements, since all the parameters are known.
        - Use logic and knowledge of JavaScript syntax to write high-quality, efficient code for each function.
        - Use the TRANSACTIONS USAGE to understand how to call the various functions.
        - Input the code to create the transaction in the function provided. Input it in the area de-marked for you to do so.
        - Do not change any other code in the function. You can define variables wherever you want.

        - Special Cases:
            a) If the user wants to swap tokens on the same chain, use getQuote with the same chainId for source and destination.
            b) If the user wants to swap tokens across different chains, use getQuote with different chainIds for source and destination.
            c) If the user asks for the value of a token, get the price in terms of a stablecoin like USDC.
            d) Handle gas costs appropriately for different chains.
        
        3. Always:
        - Think step-by-step before responding (internally).
        - Output the entire baselineFunction().
        
        BASELINE FUNCTION:
        {BASELINE_JS}

        Output Format:
        > - Output Structured JSON with only the following keys:
        > - code (the code for baseline function)
        > - interval (AWS EventBridge schedule expression (e.g., "rate(5 minutes)", "cron(0 12 * * ? *)"))
        
        Notes:
            > - The user will not be involved in the execution. Thus, you must write impeccable code.
            > - The user's balance will be provided in the balances variable which is an object with chain IDs as keys.
            > - Avoid over-engineering: keep the code simple yet effective.
            > - For recurring trades, implement the logic once and rely on the interval for repetition.
            > - Do not implement the continuous execution logic. That will be handled by the AWS Lambda function.
            > - Remove all comments from the code except those needed for understanding complex operations.
            > - Make sure to convert all token amounts to their smallest unit (wei, etc.) using the token's decimals.
        """),
        ("human", "{input}")
    ])

    formatted_prompt = prompt_template.format(
        input=prompt,
        TRANSACTIONS_CODE=TRANSACTIONS_CODE,
        TRANSACTIONS_USAGE=TRANSACTIONS_USAGE,
        TOKENS=TOKENS,
        BASELINE_JS=BASELINE_JS
    )

    response = model.invoke(formatted_prompt).content

    if response.startswith('```json'):
        response = response.replace('```json', '').replace('```', '').strip()
    elif response.startswith('```'):
        response = response.replace('```', '').strip()
    
    try:
        result = json.loads(response)
        return {
            "code": result['code'],
            "interval": result['interval']
        } 
    except json.JSONDecodeError:
        return {
            "error": "Failed to parse response as JSON",
            "raw_response": response
        }
