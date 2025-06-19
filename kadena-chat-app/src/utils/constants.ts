export const NETWORK_ID = "mainnet01";

// File size limits
export const FILE_SIZE_LIMITS = {
  IMAGE: 1024 * 1024, // 1MB
  TRAINING_FILE: 20 * 1024 * 1024, // 20MB
  UPLOAD_FILE: 2 * 1024 * 1024, // 2MB
} as const;

// API endpoints
export const API_ENDPOINTS = {
  KADENA_TRADER:
    process.env.REACT_APP_KADENA_TRADER_URL ||
    "https://kadena-trader.onrender.com",
  CHAINWEB: "https://api.chainweb.com",
  PERPLEXITY: "https://api.perplexity.ai/chat/completions",
  TATUM: "https://api.tatum.io/v4",
} as const;

// API Keys
export const API_KEYS = {
  TATUM: process.env.REACT_APP_TATUM_API_KEY || "",
} as const;

// Common error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: "File size must be less than 1MB",
  IMAGE_SIZE: "File size must be less than 1MB",
  TRAINING_FILE_SIZE: "File size must be less than 20MB",
  NETWORK_ERROR:
    "Unable to connect to the service. Please check your internet connection and try again.",
  SERVER_ERROR: "Service is currently unavailable. Please try again later.",
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment and try again.",
} as const;

// Loading text
export const LOADING_TEXT = {
  LOGGING_IN: "Logging in...",
  LOGGING_IN_MAGIC: "Login with Magic Link",
  LOGGING_IN_SPIRE: "Login with SpireKey",
  REFRESHING: "Refreshing...",
  CREATING_AGENT: "Creating agent...",
  GENERATING_QUESTIONS: "Generating questions...",
  IMPROVING_PROMPT: "Improving prompt...",
  UPLOADING_FILES: "Uploading files...",
  FETCHING_CODE: "Fetching AI code...",
} as const;
