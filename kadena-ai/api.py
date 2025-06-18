import os
import json
import requests
import datetime
import logging
from typing import Dict, List, Any, Optional, Union, Tuple, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('kadena_api.log')
    ]
)
logger = logging.getLogger(__name__)

# LangChain imports
from langchain.agents import Tool, AgentExecutor, create_openai_functions_agent
from langchain.schema import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.agents import AgentFinish, AgentActionMessageLog
from langchain.tools import BaseTool

from config import API_KEY, MODEL_NAME
from agent import run_kadena_agent_with_context

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variables
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
os.environ["API_KEY"] = os.getenv("API_KEY")

# Initialize FastAPI
app = FastAPI(
    title="Kadena AI Agent API",
    description="API for Kadena blockchain query processing using AI",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows the specified origin
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/", summary="Health check endpoint")
async def health_check():
    """
    Health check endpoint that returns the status of the service and its dependencies.
    """
    logger.info("Health check request received")
    try:
        openai_status = "healthy"
        logger.info("OpenAI status check successful")
    except Exception as e:
        openai_status = f"error: {str(e)}"
        logger.error(f"OpenAI status check failed: {str(e)}")

    try:
        # Check Kadena API connection
        logger.info("Checking Kadena API connection")
        response = requests.get(
            "https://kadena-agents.onrender.com/",
            headers={'Content-Type': 'application/json', 'x-api-key': API_KEY}
        )
        response.raise_for_status()
        kadena_status = "healthy"
        logger.info("Kadena API connection check successful")
    except Exception as e:
        kadena_status = f"error: {str(e)}"
        logger.error(f"Kadena API connection check failed: {str(e)}")

    logger.info("Health check completed successfully")
    return {
        "status": "ok",
        "version": "1.0.0",
        "dependencies": {
            "openai": openai_status,
            "kadena_api": kadena_status
        },
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# Initialize OpenAI model
model = ChatOpenAI(model="o4-mini")
    
class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's query about Kadena blockchain")
    history: Optional[List[str]] = Field(None, description="Previous conversation history")

@app.post("/query", summary="Process a natural language query about Kadena blockchain")
async def process_query(request: QueryRequest):
    logger.info("Received query request")
    try:
        logger.info("Processing query with agent")
        result = run_kadena_agent_with_context(request.query, request.history)
        logger.info("Successfully processed query")
        return result
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
