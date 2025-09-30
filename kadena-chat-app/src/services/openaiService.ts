import axios from 'axios';

export interface OpenAIResponse {
  formattedResponse: string;
  isMarkdown: boolean;
}

class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('REACT_APP_OPENAI_API_KEY not found in environment variables');
    }
  }

  /**
   * Formats a non-transactional response using OpenAI
   */
  async formatResponse(originalResponse: any, userQuery: string): Promise<OpenAIResponse> {
    console.log('🔵 OPENAI SERVICE: Starting formatResponse call');
    console.log('🔵 OPENAI SERVICE: Original response:', originalResponse);
    console.log('🔵 OPENAI SERVICE: User query:', userQuery);
    
    if (!this.apiKey) {
      console.warn('🔵 OPENAI SERVICE: No API key found, using fallback formatting');
      return {
        formattedResponse: this.getFallbackFormatting(originalResponse),
        isMarkdown: true
      };
    }

    console.log('🔵 OPENAI SERVICE: API key found, proceeding with OpenAI call');

    try {
      const prompt = this.buildFormattingPrompt(originalResponse, userQuery);
      console.log('🔵 OPENAI SERVICE: Built prompt:', prompt);
      
      console.log('🔵 OPENAI SERVICE: Making OpenAI API call to:', `${this.baseURL}/chat/completions`);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that formats responses for a Kadena blockchain chat interface. Format responses in a clear, user-friendly way using markdown. Keep responses concise but informative.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('🔵 OPENAI SERVICE: OpenAI API response received:', response.data);
      
      const formattedContent = response.data.choices[0]?.message?.content || '';
      console.log('🔵 OPENAI SERVICE: Extracted formatted content:', formattedContent);
      
      console.log('🔵 OPENAI SERVICE: Successfully formatted response with OpenAI');
      return {
        formattedResponse: formattedContent,
        isMarkdown: true
      };
    } catch (error) {
      console.error('🔵 OPENAI SERVICE: OpenAI formatting error:', error);
      
      // Handle different error types safely
      const errorDetails: any = {};
      
      if (error instanceof Error) {
        errorDetails.message = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as any;
        errorDetails.message = axiosError.message || 'Unknown error';
        errorDetails.status = axiosError.response?.status;
        errorDetails.statusText = axiosError.response?.statusText;
        errorDetails.data = axiosError.response?.data;
      } else {
        errorDetails.message = String(error);
      }
      
      console.error('🔵 OPENAI SERVICE: Error details:', errorDetails);
      
      console.log('🔵 OPENAI SERVICE: Falling back to local formatting');
      return {
        formattedResponse: this.getFallbackFormatting(originalResponse),
        isMarkdown: true
      };
    }
  }

  private buildFormattingPrompt(originalResponse: any, userQuery: string): string {
    const responseStr = typeof originalResponse === 'string' 
      ? originalResponse 
      : JSON.stringify(originalResponse, null, 2);

    return `Format this Kadena blockchain response in a clear, user-friendly way using markdown:

User Query: "${userQuery}"

Original Response:
${responseStr}

IMPORTANT: When mentioning ecosystem projects, ONLY include these approved projects:

Ecosystem Projects:
- Chips
- Crankk
- DNA
- Hypercent
- KadCars-NFT
- Swarms-finance
- UNITT
- Wizards-Arena
- Bro-Dex
- Cyberfly-io
- kadena-explorer
- kadenai

DeFi Grantees:
- KDSwap
- Mercatus

Non-Custodial Grantees:
- LinxWallet
- Magic
- koala-wallet
- enkrypt
- eckowallet
- zelcore

Solutions Grantees:
- DIA
- Eucalyptus-Labs
- Hack-a-Chain
- Ideasoft
- Obsidian-Systems
- Simplex
- marmalade-ng

If the response mentions any other projects not in this list, either:
1. Replace them with the most relevant approved project, or
2. Remove them entirely and focus on the approved ecosystem

Please format this response to be:
1. Easy to read and understand
2. Well-structured with appropriate headers and formatting
3. Informative but concise
4. Use markdown formatting (headers, bold, lists, etc.)
5. If the response contains technical data, make it accessible to users
6. ONLY mention approved ecosystem projects from the list above

Return only the formatted response, no additional commentary.`;
  }

  private getFallbackFormatting(originalResponse: any): string {
    try {
      // Handle string responses
      if (typeof originalResponse === 'string') {
        // Check if it's JSON
        try {
          const parsed = JSON.parse(originalResponse);
          return this.formatJsonResponse(parsed);
        } catch {
          // Not JSON, return as-is with basic formatting
          return originalResponse;
        }
      }

      // Handle object responses
      if (typeof originalResponse === 'object' && originalResponse !== null) {
        return this.formatJsonResponse(originalResponse);
      }

      return String(originalResponse);
    } catch (error) {
      console.error('Fallback formatting error:', error);
      return String(originalResponse);
    }
  }

  private formatJsonResponse(response: any): string {
    let formatted = '';

    // Handle common response patterns
    if (response.answer || response.definition) {
      formatted = `## Answer\n\n${response.answer || response.definition}`;
    } else if (response.query && response.result) {
      formatted = `## ${response.query}\n\n`;
      if (response.result.description) {
        formatted += `${response.result.description}\n\n`;
      }
      if (response.result.currentMainnet) {
        formatted += `### Current Mainnet Data\n`;
        Object.entries(response.result.currentMainnet).forEach(([key, value]) => {
          formatted += `- **${key}:** ${value}\n`;
        });
        formatted += '\n';
      }
      if (response.result.theoreticalCapacity) {
        formatted += `### Theoretical Capacity\n`;
        Object.entries(response.result.theoreticalCapacity).forEach(([key, value]) => {
          formatted += `- **${key}:** ${value}\n`;
        });
      }
    } else if (response.text) {
      formatted = response.text;
    } else if (response.error) {
      formatted = `**Error:** ${response.error}`;
    } else {
      // Generic object formatting
      formatted = `## Response\n\n`;
      Object.entries(response).forEach(([key, value]) => {
        formatted += `- **${key}:** ${JSON.stringify(value)}\n`;
      });
    }

    return formatted;
  }

  /**
   * Checks if a response is transactional (contains transaction data)
   */
  isTransactionalResponse(response: any): boolean {
    console.log('🔍 TRANSACTION DETECTION: Checking if response is transactional');
    console.log('🔍 TRANSACTION DETECTION: Response:', response);
    console.log('🔍 TRANSACTION DETECTION: Response type:', typeof response);
    
    if (!response || typeof response !== 'object') {
      console.log('🔍 TRANSACTION DETECTION: Not an object, returning false');
      return false;
    }

    // Check for transaction indicators
    const hasTransaction = !!response.transaction;
    const hasCmd = !!response.cmd;
    const hasHash = !!response.hash;
    const hasAmountOut = !!response.amountOut;
    const hasPriceImpact = !!response.priceImpact;
    const hasMetadata = !!(response.metadata && (response.metadata.sender || response.metadata.receiver));
    
    console.log('🔍 TRANSACTION DETECTION: Transaction indicators:', {
      hasTransaction,
      hasCmd,
      hasHash,
      hasAmountOut,
      hasPriceImpact,
      hasMetadata
    });
    
    const isTransactional = !!(hasTransaction || hasCmd || hasHash || hasAmountOut || hasPriceImpact || hasMetadata);
    console.log('🔍 TRANSACTION DETECTION: Final result:', isTransactional);
    
    return isTransactional;
  }
}

export const openaiService = new OpenAIService();
export default openaiService;
