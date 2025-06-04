# EVM Chain Trading Agent

This project implements a cross-chain trading agent for EVM blockchains (Ethereum, Polygon, Arbitrum, Optimism, Base, etc.) using the Li.Fi API. The agent allows users to execute token swaps across different EVM chains, get price quotes, check wallet balances, and more.

## Features

- Cross-chain token swaps using Li.Fi API
- Price quotations for token pairs
- Natural language processing of swap instructions
- Wallet balance checking
- Support for multiple EVM chains
- RESTful API for integration with other applications

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd evm-agents
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the required environment variables:

   ```
   # Li.Fi API Key
   LIFI_API_KEY=your_lifi_api_key

   # Wallet configuration
   PRIVATE_KEY=your_wallet_private_key

   # RPC URLs for different chains
   RPC_URL=https://mainnet.infura.io/v3/your_infura_key
   RPC_URL_1=https://mainnet.infura.io/v3/your_infura_key
   RPC_URL_137=https://polygon-rpc.com
   RPC_URL_42161=https://arb1.arbitrum.io/rpc
   RPC_URL_10=https://mainnet.optimism.io
   RPC_URL_8453=https://mainnet.base.org

   # Server configuration
   PORT=3001
   ```

## Usage

### Running the Agent API Server

Start the API server:

```
node api.js
```

The server will start on the specified port (default: 3001).

### Running the Baseline Example

To run the baseline example:

```
node baseline.js
```

This will execute a sample token swap flow, demonstrating how to use the agent's functionality.

## API Endpoints

The agent provides the following API endpoints:

### Health Check

```
GET /health
```

Returns the status of the API server.

### Get Supported Chains and Tokens

```
GET /chains
```

Returns a list of supported chains and their associated tokens.

### Get Wallet Balances

```
GET /balances/:address?chainId=1
```

Returns the token balances for the specified wallet address on the given chain.

### Get Token Price Quote

```
POST /quote
```

Request body:

```json
{
  "fromChain": 1,
  "fromTokenAddress": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "toChainId": 137,
  "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "amount": "1"
}
```

Returns a price quote for the token swap.

### Execute Token Swap

```
POST /swap
```

Request body:

```json
{
  "fromChain": 1,
  "fromTokenAddress": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "toChainId": 137,
  "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "amount": "0.1",
  "slippage": 0.5
}
```

Executes the token swap and returns the transaction result.

### Process Natural Language Instruction

```
POST /process
```

Request body:

```json
{
  "instruction": "swap 0.1 ETH on Ethereum to USDC on Polygon"
}
```

Processes a natural language instruction to execute a token swap.

### Get Common Tokens

```
GET /tokens?chainId=1
```

Returns a list of common tokens for the specified chain ID. If no chain ID is provided, returns tokens for all supported chains.

## Code Structure

- `transactions.js`: Core functions for interacting with the Li.Fi API
- `agent.js`: Main agent logic and functions
- `api.js`: RESTful API server
- `baseline.js`: Example implementation showing usage

## Using the Li.Fi API

This agent uses the [Li.Fi API](https://docs.li.fi/integrate-li.fi-js/get-a-quote) for cross-chain swaps. Li.Fi aggregates multiple DEXs and bridges to find the best routes for token swaps across different blockchains.

To use the Li.Fi API, you need to:

1. Get an API key from the [Li.Fi Developer Portal](https://docs.li.fi/li.fi-api/get-api-keys)
2. Add the API key to your `.env` file as `LIFI_API_KEY`

## Example: Natural Language Processing

The agent includes a simple natural language processing function that can understand instructions like:

- "Swap 0.1 ETH on Ethereum to USDC on Polygon"
- "Swap 100 USDC from Polygon to ETH on Arbitrum"

This makes it easy to integrate the agent with conversational interfaces or chatbots.

## License

This project is licensed under the MIT License.
