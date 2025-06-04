import os
import json
import logging
from typing import Dict, List, Any, Optional
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
        logging.FileHandler('evm_agents.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="EVM Agents API",
    description="API for EVM trading agent code generation and prompt improvement using LiFi",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    history: Optional[List[str]] = Field(default_factory=list)

class CodeRequest(BaseModel):
    prompt: str
    history: Optional[List[str]] = Field(default_factory=list)

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/prompt", summary="Evaluate and improve a trading agent prompt")
async def process_prompt(request: PromptRequest):
    """
    Process a trading agent prompt, evaluate it, and provide improvement suggestions.
    
    Args:
        request: PromptRequest containing the prompt and optional history
        
    Returns:
        Dict containing the evaluation results and improvement suggestions
    """
    logger.info(f"Processing prompt request: {request.prompt[:100]}...")
    
    try:
        from prompt import improve_prompt
        result = improve_prompt(prompt=request.prompt, history=request.history)
        logger.info("Prompt processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"Error processing prompt: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/code", summary="Generate code for a trading agent")
async def generate_code(request: CodeRequest):
    """
    Generate JavaScript code for a trading agent based on the provided prompt.
    
    Args:
        request: CodeRequest containing the prompt and optional history
        
    Returns:
        Dict containing the generated code and execution interval
    """
    logger.info(f"Generating code for prompt: {request.prompt[:100]}...")
    
    try:
        from coder import code
        result = code(prompt=request.prompt)
        logger.info("Code generation completed successfully")
        return result
    except Exception as e:
        logger.error(f"Error generating code: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chains", summary="Get supported chains information")
async def get_chains():
    """
    Get information about all supported EVM chains.
    
    Returns:
        Dict containing chain information
    """
    logger.info("Getting supported chains information...")
    
    try:
        # Execute the JavaScript code to get chains data
        import subprocess
        import json
        
        process = subprocess.run(
            ["node", "-e", "require('./transactions').getChains().then(data => console.log(JSON.stringify(data)))"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if process.returncode != 0:
            raise Exception(f"Failed to get chains: {process.stderr}")
        
        chains_data = json.loads(process.stdout)
        logger.info("Retrieved chains information successfully")
        return {"chains": chains_data}
    except Exception as e:
        logger.error(f"Error getting chains: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tokens/{chain_id}", summary="Get tokens for a specific chain")
async def get_tokens(chain_id: int):
    """
    Get all supported tokens for a specific chain.
    
    Args:
        chain_id: Chain ID to get tokens for
        
    Returns:
        Dict containing token information
    """
    logger.info(f"Getting tokens for chain ID: {chain_id}...")
    
    try:
        # Execute the JavaScript code to get tokens data
        import subprocess
        import json
        
        process = subprocess.run(
            ["node", "-e", f"require('./transactions').getTokens({{chainId: {chain_id}}}).then(data => console.log(JSON.stringify(data)))"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if process.returncode != 0:
            raise Exception(f"Failed to get tokens: {process.stderr}")
        
        tokens_data = json.loads(process.stdout)
        logger.info(f"Retrieved tokens for chain ID {chain_id} successfully")
        return {"tokens": tokens_data}
    except Exception as e:
        logger.error(f"Error getting tokens for chain {chain_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quote", summary="Get a quote for swapping tokens")
async def get_quote(request: dict):
    """
    Get a quote for swapping tokens across chains.
    
    Args:
        request: Dict containing quote parameters
        
    Returns:
        Dict containing the quote response
    """
    logger.info(f"Getting quote: {json.dumps(request)[:100]}...")
    
    try:
        # Execute the JavaScript code to get quote
        import subprocess
        import json
        
        process = subprocess.run(
            ["node", "-e", f"require('./transactions').getQuote({json.dumps(request)}).then(data => console.log(JSON.stringify(data)))"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if process.returncode != 0:
            raise Exception(f"Failed to get quote: {process.stderr}")
        
        quote_data = json.loads(process.stdout)
        logger.info("Retrieved quote successfully")
        return quote_data
    except Exception as e:
        logger.error(f"Error getting quote: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
