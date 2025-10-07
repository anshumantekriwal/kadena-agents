// This service is deprecated - all AI processing is now handled by the backend API
// The backend at k-agent.onrender.com handles all response formatting and processing

export interface OpenAIResponse {
  formattedResponse: string;
  isMarkdown: boolean;
}

class OpenAIService {
  /**
   * Checks if a response is transactional (contains transaction data)
   * This is still used by the frontend to determine display logic
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
