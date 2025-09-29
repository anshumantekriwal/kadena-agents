import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import {
  chatApi,
  TransactionData,
  TransactionResponse,
  QuoteResponse,
  TransactionMetadata,
  NFTMetadata,
  TransactionQuote,
} from "../services/api";
import walletService, { SignAndSubmitResult } from "../services/walletService";
import WalletInfo from "./WalletInfo";
import "./Chat.css";
import { getAllBalances } from "../utils/transactions";
import Navbar from "./Navbar";

interface Message {
  role: "user" | "assistant";
  content: string;
  isMarkdown?: boolean;
}

interface UserContext {
  accountName: string;
  publicKey: string;
  chainId: string;
}

// Define transaction response interface
interface TransactionResponseData {
  transaction: {
    cmd: string;
    hash: string;
    sigs: (string | null)[];
  };
  quote?: {
    expectedIn: string;
    expectedOut: string;
    slippage: number;
    priceImpact: string;
  };
  [key: string]: any;
}

const SendButton = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
  </svg>
);

const LoadingDots = () => (
  <div className="loading-dots">
    <div className="dot"></div>
    <div className="dot"></div>
    <div className="dot"></div>
  </div>
);

const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const { balances } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTransaction, setPendingTransaction] =
    useState<TransactionResponse | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<SignAndSubmitResult | null>(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only scroll to bottom when there are messages and not on initial load
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Focus input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Function to extract answer from JSON responses
  const extractAnswerFromJson = (content: string): string | null => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      
      // Check if it's an object with an "answer" or "definition" property
      if (parsed && typeof parsed === 'object') {
        if ('answer' in parsed) {
          return parsed.answer;
        }
        if ('definition' in parsed) {
          return parsed.definition;
        }
      }
      
      return null;
    } catch (error) {
      // Not valid JSON or doesn't have answer/definition property
      return null;
    }
  };

  // Format transaction response for display
  const formatTransactionResponse = (response: any): string => {
    try {
      // Handle null or undefined response
      if (!response) {
        return "I received an empty response. Please try again.";
      }

      // Check if response is a string that might contain JSON with answer
      if (typeof response === 'string') {
        const extractedAnswer = extractAnswerFromJson(response);
        if (extractedAnswer) {
          return extractedAnswer;
        }
      }

      // Handle quote-only response
      if ("amountOut" in response && "priceImpact" in response) {
        const quoteResponse = response as QuoteResponse;
        return (
          `### Quote Details\n` +
          `- **${quoteResponse.text || "Amount"}:** ${
            quoteResponse.amountOut
          }\n` +
          `- **Price Impact:** ${quoteResponse.priceImpact}%\n`
        );
      }

      // Handle transaction response
      if (response.transaction) {
        const txResponse = response as TransactionResponse;
        let formattedResponse = `## Transaction Generated\n`;

        // Handle swap quote details
        if (txResponse.quote) {
          formattedResponse +=
            `### Exchange Details\n` +
            `- **Input Amount:** ${txResponse.quote.expectedIn}\n` +
            `- **Output Amount:** ${txResponse.quote.expectedOut}\n` +
            `- **Price Impact:** ${txResponse.quote.priceImpact}%\n` +
            `- **Slippage Tolerance:** ${txResponse.quote.slippage}%\n\n`;
        }

        // Handle transfer metadata
        if (txResponse.metadata && "sender" in txResponse.metadata) {
          const metadata = txResponse.metadata as TransactionMetadata;
          formattedResponse +=
            `### Transfer Details\n` +
            `- **From:** ${metadata.sender}\n` +
            `- **To:** ${metadata.receiver}\n` +
            `- **Amount:** ${metadata.formattedAmount}\n` +
            `- **Token:** ${metadata.tokenAddress}\n` +
            `- **Estimated Gas:** ${metadata.estimatedGas} KDA\n\n`;
        }

        // Handle NFT metadata
        if (txResponse.metadata && "uri" in txResponse.metadata) {
          const metadata = txResponse.metadata as NFTMetadata;
          formattedResponse +=
            `### NFT Details\n` +
            `- **Name:** ${metadata.name}\n` +
            `- **Description:** ${metadata.description}\n` +
            `- **Collection:** ${metadata.collection}\n` +
            `- **Royalties:** ${metadata.royalties}\n` +
            `- **URI:** ${metadata.uri}\n\n`;
        }

        // Handle collection ID
        if (txResponse.collectionId) {
          formattedResponse +=
            `### Collection Details\n` +
            `- **Collection ID:** ${txResponse.collectionId}\n\n`;
        }

        // Handle token ID
        if (txResponse.tokenId) {
          formattedResponse +=
            `### Token Details\n` + `- **Token ID:** ${txResponse.tokenId}\n\n`;
        }

        // Add transaction details with error handling
        try {
          const cmdData =
            typeof txResponse.transaction.cmd === "string"
              ? JSON.parse(txResponse.transaction.cmd)
              : txResponse.transaction.cmd;

          formattedResponse +=
            `### Transaction Details\n` +
            `- **Hash:** \`${txResponse.transaction.hash}\`\n` +
            `- **Chain ID:** ${cmdData?.meta?.chainId || "Unknown"}\n` +
            `- **Network:** ${cmdData?.networkId || "Unknown"}\n\n` +
            `**Do you want to sign and submit this transaction?**`;
        } catch (parseError) {
          console.warn("Error parsing transaction command:", parseError);
          formattedResponse +=
            `### Transaction Details\n` +
            `- **Hash:** \`${txResponse.transaction.hash}\`\n` +
            `- **Chain ID:** Unknown\n` +
            `- **Network:** Unknown\n\n` +
            `**Do you want to sign and submit this transaction?**`;
        }

        return formattedResponse;
      }

      // Handle balance responses (arrays of token balances)
      if (Array.isArray(response)) {
        let balanceResponse = `### Your Wallet Balances\n\n`;
        response.forEach((balance: any) => {
          if (balance.token && balance.amount !== undefined) {
            balanceResponse += `- **${balance.token}:** ${balance.amount}\n`;
          }
        });
        return balanceResponse || "No balances found.";
      }

      // Handle simple text responses that might be objects
      if (response.text && typeof response.text === "string") {
        return response.text;
      }

      // Handle error responses
      if (response.error) {
        return `**Error:** ${
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error)
        }`;
      }

      // Default JSON formatting for other response types
      return `\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``;
    } catch (error) {
      console.error("Error formatting transaction response:", error);
      return `I encountered an error while formatting the response. Please try again.`;
    }
  };

  // Function to convert markdown text to HTML (basic implementation)
  const renderMarkdown = (content: string): string => {
    try {
      if (!content || typeof content !== "string") {
        return "";
      }

      // Convert headers: # Header -> <h1>Header</h1>
      let html = content
        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
        .replace(/^# (.*$)/gm, "<h1>$1</h1>");

      // Convert bold: **text** -> <strong>text</strong>
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Convert italic: *text* -> <em>text</em>
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

      // Convert code blocks first (before inline code)
      html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

      // Convert inline code: `code` -> <code>code</code>
      html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

      // Convert lists: - item -> <li>item</li>
      html = html
        .replace(/^\s*- (.*$)/gm, "<li>$1</li>")
        .replace(/<li>(.*?)<\/li>/g, "<ul><li>$1</li></ul>");

      // Fix nested lists
      html = html.replace(/<\/ul>\s*<ul>/g, "");

      // Convert links: [text](url) -> <a href="url">text</a>
      html = html.replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // Convert line breaks to <br> for single line breaks
      html = html.replace(/\n(?!\n)/g, "<br>");

      // Convert paragraphs: add <p> tags for double line breaks
      html = html
        .replace(/\n\n/g, "</p><p>")
        .replace(/^(?!<[hup])/gm, "<p>")
        .replace(/(?<![>])$/gm, "</p>");

      // Clean up empty paragraphs and fix formatting
      html = html
        .replace(/<p><\/p>/g, "")
        .replace(/<p>(<[hul])/g, "$1")
        .replace(/(<\/[hul][^>]*>)<\/p>/g, "$1")
        .replace(/^<p>/, "")
        .replace(/<\/p>$/, "");

      return html;
    } catch (error) {
      console.error("Error rendering markdown:", error);
      return content; // Return original content if markdown parsing fails
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.isMarkdown) {
      return (
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
      );
    }
    return <div className="text-content">{message.content}</div>;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Intercept queries about Kadena TPS and respond with a fixed answer
      const lowerContent = userMessage.content.toLowerCase();
      const mentionsKadena = lowerContent.includes("kadena");
      const mentionsTps = lowerContent.includes("tps") || lowerContent.includes("transactions per second");
      if (mentionsKadena && mentionsTps) {
        const assistantMessage: Message = {
          role: "assistant",
          content: "KADENA HAS A TPS OF 1000",
          isMarkdown: false,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      const userContext: UserContext = {
        accountName: user.accountName || "",
        publicKey: user.publicKey || "",
        chainId: "2",
      };

      // Create context string
      const context = {
        accountName: userContext.accountName,
        publicKey: userContext.publicKey,
        guard: {
          keys: [userContext.publicKey],
          pred: "keys-all",
        },
        chainId: userContext.chainId,
        balances: balances,
      };

      const contextString = "User Details: " + JSON.stringify(context);
      const enhancedQuery = `${userMessage.content}\n${contextString}`;

      const response = await chatApi.sendQuery({
        query: enhancedQuery,
        history: [],
      });

      let assistantMessage: Message;
      let apiResponse = response.response;

      // Handle cases where the response is a JSON string
      if (typeof apiResponse === "string") {
        // First check if it's a JSON with answer field
        const extractedAnswer = extractAnswerFromJson(apiResponse);
        if (extractedAnswer) {
          assistantMessage = {
            role: "assistant",
            content: extractedAnswer,
            isMarkdown: false,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          return;
        }
        
        // If not, try to parse as regular JSON
        try {
          apiResponse = JSON.parse(apiResponse);
        } catch (e) {
          // Not a valid JSON string, apiResponse remains a string.
        }
      }

      // Check if the response is a transaction that needs user confirmation
      if (
        apiResponse &&
        typeof apiResponse === "object" &&
        "transaction" in apiResponse
      ) {
        setPendingTransaction(apiResponse as TransactionResponse);
        assistantMessage = {
          role: "assistant",
          content: formatTransactionResponse(apiResponse),
          isMarkdown: true,
        };
      } else if (
        apiResponse &&
        typeof apiResponse === "object" &&
        ("amountOut" in apiResponse || "priceImpact" in apiResponse)
      ) {
        // Handle quote-only responses
        assistantMessage = {
          role: "assistant",
          content: formatTransactionResponse(apiResponse),
          isMarkdown: true,
        };
      } else if (typeof apiResponse === "string") {
        // Handle string responses
        assistantMessage = {
          role: "assistant",
          content: apiResponse,
          isMarkdown: false,
        };
      } else if (apiResponse && typeof apiResponse === "object") {
        // Handle other object responses (JSON format)
        assistantMessage = {
          role: "assistant",
          content: formatTransactionResponse(apiResponse),
          isMarkdown: true,
        };
      } else {
        // Fallback for any other response type
        assistantMessage = {
          role: "assistant",
          content: String(
            apiResponse || "I received an empty response. Please try again."
          ),
          isMarkdown: false,
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);

      const errorAssistantMessage: Message = {
        role: "assistant",
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again or rephrase your request.`,
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignAndSubmitTransaction = async () => {
    if (!pendingTransaction) {
      return;
    }

    setIsSubmittingTx(true);
    try {
      const result = await walletService.signAndSubmitTransaction(
        pendingTransaction
      );
      setTransactionResult(result);

      // Add a new message showing the transaction result
      const resultMessage: Message = {
        role: "assistant",
        content:
          result.status === "success"
            ? `## ✅ Transaction Submitted Successfully!\n` +
              `**Request Key:** \`${result.requestKey}\`\n` +
              `You can track this transaction on the blockchain explorer.`
            : `## ❌ Transaction Failed\n` +
              `${result.errorMessage || "Unknown error"}\n` +
              `Please try again or contact support if the issue persists.`,
        isMarkdown: true,
      };

      setMessages((prev) => [...prev, resultMessage]);
      setPendingTransaction(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);

      const errorResultMessage: Message = {
        role: "assistant",
        content:
          `## ❌ Transaction Signing Failed\n` +
          `${errorMessage}\n` +
          `Please check your wallet connection and try again.`,
        isMarkdown: true,
      };

      setMessages((prev) => [...prev, errorResultMessage]);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const toggleWallet = () => {
    setShowWallet(!showWallet);
  };

  const handleConfirmTransaction = () => {
    if (pendingTransaction) {
      handleSignAndSubmitTransaction();
    }
  };

  const handleCancelTransaction = () => {
    setPendingTransaction(null);

    const cancelMessage: Message = {
      role: "assistant",
      content: "Transaction cancelled.",
      isMarkdown: true,
    };

    setMessages((prev) => [...prev, cancelMessage]);
  };

  const handleLaunchAgent = () => {
    window.location.href = "/agent";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  return (
    <>
      <div className="chat-container">
        <Navbar />

        <div className="chat-content">
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <div className="chat-welcome">
                  <div className="chat-agent-avatar">
                    <span>🤖</span>
                  </div>
                  <h1 className="chat-welcome-title">Hello! I'm Agent K</h1>
                  <p className="chat-welcome-subtitle">
                    Your Kadena blockchain assistant.
                    <br />
                    How can I help you today?
                  </p>
                  <div className="chat-suggestions">
                    <button
                      className="chat-suggestion"
                      onClick={() =>
                        setInputValue("Create a new NFT collection")
                      }
                    >
                      🎨 Create NFT Collection
                    </button>
                    <button
                      className="chat-suggestion"
                      onClick={() => setInputValue("How do I swap tokens?")}
                    >
                      🔄 How to swap tokens
                    </button>
                    <button
                      className="chat-suggestion"
                      onClick={() =>
                        setInputValue("Mint an NFT in my collection")
                      }
                    >
                      🖼️ Mint NFT
                    </button>
                    <button
                      className="chat-suggestion"
                      onClick={() =>
                        setInputValue("Send 1 KDA to another wallet")
                      }
                    >
                      💸 Transfer tokens
                    </button>
                  </div>
                </div>
                <div className="chat-disclaimer">
                  <div className="disclaimer-content">
                    <h4>⚠️ Important Disclaimer</h4>
                    <p>
                      This chat interface has been created to simplify the transacting experience on Kadena. 
                      Agent K is an experimental AI assistant and any information provided by the AI might be false. 
                      Always verify transaction details from reliable sources before confirming. 
                      Transactions on the blockchain are irreversible.
                    </p>
                    <p>
                      <strong>Security Warning:</strong> NEVER share your
                      private key or seed phrase. This application will never
                      ask for them.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      message.role === "user"
                        ? "chat-message-user"
                        : "chat-message-assistant"
                    } ${
                      error && index === messages.length - 1
                        ? "chat-message-error"
                        : ""
                    }`}
                  >
                    <div className="chat-message-avatar">
                      {message.role === "user" ? (
                        <div className="user-avatar-chat">
                          {user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                      ) : (
                        <div className="assistant-avatar-chat">🤖</div>
                      )}
                    </div>
                    <div className="chat-message-content">
                      {renderMessageContent(message)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chat-message chat-message-assistant">
                    <div className="chat-message-avatar">
                      <div className="assistant-avatar-chat">🤖</div>
                    </div>
                    <div className="chat-message-content">
                      <div className="chat-loading">
                        <LoadingDots />
                        <span>Agent K is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transaction confirmation buttons */}
            {pendingTransaction && !isSubmittingTx && !transactionResult && (
              <div className="chat-transaction-actions">
                <div className="transaction-prompt">
                  <h4>🔐 Transaction Ready</h4>
                  <p>
                    Review the transaction details above and choose an action:
                  </p>
                </div>
                <div className="transaction-buttons">
                  <button
                    className="transaction-confirm-button"
                    onClick={handleConfirmTransaction}
                    disabled={isSubmittingTx}
                  >
                    ✅ Sign & Submit
                  </button>
                  <button
                    className="transaction-cancel-button"
                    onClick={handleCancelTransaction}
                    disabled={isSubmittingTx}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {isSubmittingTx && (
              <div className="chat-message chat-message-assistant">
                <div className="chat-message-avatar">
                  <div className="assistant-avatar-chat">🤖</div>
                </div>
                <div className="chat-message-content">
                  <div className="chat-loading">
                    <LoadingDots />
                    <span>Signing and submitting transaction...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Only render scroll anchor when there are messages */}
            {messages.length > 0 && <div ref={messagesEndRef} />}
          </div>

          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <div className="chat-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Agent K anything about Kadena..."
                  disabled={isLoading || isSubmittingTx}
                  className="chat-input"
                />
                <button
                  type="submit"
                  className="chat-send-button"
                  disabled={!inputValue.trim() || isLoading || isSubmittingTx}
                >
                  {isLoading ? <LoadingDots /> : <SendButton />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
