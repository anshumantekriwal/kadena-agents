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
from variables import TRANSACTIONS_CODE, TRANSACTIONS_USAGE, TOKENS, BASELINE_JS, PREDEFINED_PARAMETERS

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variables
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

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
    You are <Agent K1>, a trading agent launcher created by Xade.

    Your task is to generate code to run on a serverless function to execute a user's trading positions on the Kadena Blockchain.
    You will be working only on mainnet01 and chain ID 2.
    You will be writing code in JavaScript.
    
    You will be provided with a prompt containing all the information required to handle and execute the trading position.
    You will be provided with the user's account details. You will also be provided with the balances of all the user's tokens.
    You will have access to all the functions you may need to include to achieve this task as well.

    Here are some resources to help you in your task:
      1. Transactions Documentation:
        {TRANSACTIONS_CODE}
        This snippet contains the docstring of functions to call the Transactions API to generate unsigned transactions. 
        These functuons will be pre-defined. You need to use them to generate transactions.
      2. Transactions Usage:
        {TRANSACTIONS_USAGE}
        This contains examples to call/access the various endpoints of the Transactions API.
      3. Documentation for Tokens:
        {TOKENS}
        This documentation contains information about all the tokens on the Kadena Blockchain.
     4. Predefined Parameters:
        {PREDEFINED_PARAMETERS}
        This documentation contains information about some variables that are predefined within the execution environment.
    
    Here are some rules to follow:
      1. Do not access any external JavaScript libraries/packages. This may cause the script to fail.
      2. Use the DATE variable to get the current date and time, nothing else.
      3. Whenever USD is mentioned, assume it is zUSD.
      4. Always output the entire the baselineFunction().

    When a user prompt arrives:
    1. Analyze requirements:
      - Use the TOKENS documentation to validate any symbols or coins or addresses that the user provides.
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
      - Special Case:
        a) If the user asks you for the value or price of a token, use the quotes transaction tool to get the price of the token.
        b) if the user asks for a value of any token, return it in terms of KDA and if they ask for vlaue of KDA, return in terms of zUSD.
     3. Generate code to execute baselineFunction() at a specified time or interval:
      - Extract the execution time or interval provided by the user.
      - If the user provides a specific time, set baselineFunction() to run recurringly at that time.
      - If the user provides an interval, set baselineFunction() to run recurringly at that interval.
      - Use the Date() function to get the current date and time.
      - Do not add any other checks or logic to this. Only the time or interval check.
      - Log whether or not the baselineFunction() will be triggered or not.
     
     BASELINE FUNCTION:
     {BASELINE_JS}

     Output Format:
     > - Output Structured JSON with only the following keys:
     > - code (the code for baseline function)
     > - interval (code to call/execute the baseline function at the time orinterval specified by the user)
     
     Notes:
          > - The user will not be involved in the execution. Thus, you must write impeccable code.
          > - The user's balance will be provided in the balances variable in the format: 
            {{
              'coin': '4.998509',
              'kaddex.kdx': '1500',
              'n_b742b4e9c600892af545afb408326e82a6c0c6ed.zUSD': '0.5',
              'n_582fed11af00dc626812cd7890bb88e72067f28c.bro': '0.0015',
              'runonflux.flux': '1.70313993'
            }}
          > - Avoid over-engineering: keep the code simple yet effective.
     
    """),
    ("human", "{input}")
  ])

    formatted_prompt = prompt_template.format(
        input=prompt,
        TOKENS=TOKENS,
        TRANSACTIONS_CODE=TRANSACTIONS_CODE,
        TRANSACTIONS_USAGE=TRANSACTIONS_USAGE,
        BASELINE_JS=BASELINE_JS,
        PREDEFINED_PARAMETERS=PREDEFINED_PARAMETERS
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
