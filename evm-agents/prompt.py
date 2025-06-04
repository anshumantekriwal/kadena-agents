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

API_DOCS = {
    # LiFi get supported chains
    "getChains": {
        "description": "Get all supported chains for LiFi",
        "required_params": [],
        "optional_params": [],
        "endpoint": "/chains"
    },
    
    # LiFi get tokens for a chain
    "getTokens": {
        "description": "Get all tokens for a specific chain",
        "required_params": [
            "chainId"  # Chain ID of the EVM network
        ],
        "optional_params": [],
        "endpoint": "/tokens/{chainId}"
    },
    
    # LiFi get quote
    "getQuote": {
        "description": "Get a quote for swapping tokens across chains",
        "required_params": [
            "fromChain",    # Source chain ID
            "fromTokenAddress", # Source token address
            "toChainId",      # Destination chain ID
            "toTokenAddress", # Destination token address
            "fromAmount"      # Amount to swap in token's smallest unit
        ],
        "optional_params": [
            {"name": "fromAddress", "description": "Sender's address"},
            {"name": "slippage", "description": "Maximum acceptable slippage as percentage (e.g., 0.5 for 0.5%)"},
            {"name": "integrator", "description": "Integrator identifier"},
            {"name": "fee", "description": "Fee percentage for integrator"},
            {"name": "allowBridges", "description": "Allowed bridge services"},
            {"name": "allowExchanges", "description": "Allowed exchange services"},
            {"name": "allowDexes", "description": "Allowed DEXes"}
        ],
        "endpoint": "/quote"
    },
    
    # LiFi execute swap
    "executeSwap": {
        "description": "Execute a token swap across chains",
        "required_params": [
            "fromChain",    # Source chain ID
            "fromTokenAddress", # Source token address
            "toChainId",      # Destination chain ID
            "toTokenAddress", # Destination token address
            "fromAmount",     # Amount to swap in token's smallest unit
            "fromAddress"     # Sender's address
        ],
        "optional_params": [
            {"name": "slippage", "description": "Maximum acceptable slippage as percentage (e.g., 0.5 for 0.5%)"},
            {"name": "integrator", "description": "Integrator identifier"},
            {"name": "fee", "description": "Fee percentage for integrator"},
            {"name": "allowBridges", "description": "Allowed bridge services"},
            {"name": "allowExchanges", "description": "Allowed exchange services"},
            {"name": "allowDexes", "description": "Allowed DEXes"}
        ],
        "endpoint": "/swap"
    }
}

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

OUTPUT_FORMAT = {
  "rating": "<1–10>",
  "justification": "<one-sentence explanation of your score>",
  "questions": [
    "Question 1…",
    "Question 2…",
    "..."
  ]
}

def improve_prompt(prompt: str, history: List[str] = None) -> Dict[str, Any]:

    model = ChatOpenAI(model="o4-mini")

    if history is None:
        history = []

    formatted_history = "\n".join(history) if history else "No previous conversation"

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """
    You are <Agent EVM>, a trading agent launcher created by Xade for EVM chains.

    You are tasked with helping users create prompts to launch trading agents on various EVM chains using the LiFi protocol for cross-chain swaps.

    You will be called repeatedly until the prompt is acceptable. Each time you receive:
    - A full draft of the user's system prompt (their new version or their previous one along with answers to your questions)
    - Any previous dialogue about the prompt
    - The same context inputs:
        - Agent Name
        - Agent Description
        - Trading Strategy

    Based on the same, you will assign a rating to the prompt on a scale of 1-10.
    Additionally, you will provide a list of questions that the user should address with the prompt.
        
    Previous Dialogue:
    {HISTORY}

    Here are some resources to help you in your task:
    1. Documentation for Tokens:
        {TOKENS}
    This documentation contains information about common tokens on different EVM chains, so you can validate any token addresses or symbols the user provides.
    2. Onchain Information:
    The trading agent will operate across various EVM chains, including Ethereum (1), Polygon (137), Arbitrum (42161), Optimism (10), and Base (8453).

    When you are provided the prompt:
    1. Evaluate the draft prompt for clarity and fitness to its specific strategy (from simple DCA to complex cross-chain trading strategies).  
    2. Assign a score (1–10) based only on clarity of intent and requirements.  
    3. Justify your score in one concise sentence.  
    4. Ask only the follow-up questions necessary to fill real gaps about the trading strategy.

    Output Format: 
    > - Output Structured JSON with only the following keys:
    > - rating (number between 1 and 10)
    > - justification (one sentence explanation of your score)
    > - questions (list of questions)

    > **Notes:**
    > - Authentication and transaction signing is handled later; omit related questions.  
    > - All the handling of the execution of the transaction, transaction-failure, other such issues or obtaining pricing/liquidity pools is handled directly by Xade. Do not bother the user with such issues.
    > - Avoid over-engineering: for simple strategies, skip irrelevant details.  
    > - Be consistent with your ratings.
    > - If the prompt includes cross-chain operations, ensure it clearly specifies source and destination chains and tokens.
    > - Strictly steer clear of any non-strategy related questions. All of the handling of the execution of the strategy is to be done by Xade.
         
    """),
        ("human", "{input}")
    ])
    
    formatted_prompt = prompt_template.format(input=prompt, HISTORY=formatted_history, TOKENS=TOKENS)
    
    response = model.invoke(formatted_prompt).content

    print(response)
    
    # Handle JSON response wrapped in markdown code blocks
    if response.startswith('```json'):
        response = response.replace('```json', '').replace('```', '').strip()
    elif response.startswith('```'):
        response = response.replace('```', '').strip()
    
    result = json.loads(response)
    
    history.extend([
        "Human: "+formatted_prompt,
        "AI: "+str(result)
    ])

    return {
        "response": result,
        "history": history
    }
