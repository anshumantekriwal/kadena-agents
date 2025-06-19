import { API_ENDPOINTS } from "../utils/constants";

export interface PromptRequest {
  prompt: string;
}

export interface PromptResponse {
  response: {
    rating: number;
    justification?: string;
    questions?: string[];
  };
}

export interface CodeRequest {
  agentName: string;
  agentDescription: string;
  agentBehavior: string;
  selectedSources: string[];
  selectedChains: string[];
}

export interface CodeResponse {
  code: string;
  interval: string;
}

class KadenaTraderApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.KADENA_TRADER;
  }

  async getPromptRating(request: PromptRequest): Promise<PromptResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI rating");
      }

      const data = await response.json();
      let parsed;
      try {
        parsed = typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        throw new Error("AI response was not valid JSON");
      }

      return parsed;
    } catch (error) {
      console.error("Error getting prompt rating:", error);
      throw error;
    }
  }

  async getAICode(request: CodeRequest): Promise<CodeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI code");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting AI code:", error);
      throw error;
    }
  }
}

export const kadenaTraderApi = new KadenaTraderApi();
