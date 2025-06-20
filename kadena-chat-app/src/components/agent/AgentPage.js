import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import "./AgentPage.css";
import { useNavigate, useParams } from "react-router-dom";
import { tokens } from "../../utils/tokens";
import { supabase } from "../../lib/supabase";
import { getAllBalances } from "../../utils/transactions";
import { API_ENDPOINTS, API_KEYS } from "../../utils/constants";

const AgentPage = () => {
  const { agentId } = useParams();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [deploymentStatus, setDeploymentStatus] = useState("Initializing...");
  const [balances, setBalances] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState(null);

  // Withdraw-related state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [selectedToken, setSelectedToken] = useState("coin");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch agent data from Supabase
    const fetchAgentData = async () => {
      if (!agentId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("kadena-agents")
          .select("*")
          .eq("id", agentId)
          .single();

        if (error) {
          console.error("Error fetching agent:", error);
          alert("Error fetching agent data");
          navigate("/agent");
          return;
        }

        setAgentData(data);
      } catch (error) {
        console.error("Error fetching agent:", error);
        alert("Error fetching agent data");
        navigate("/agent");
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId, navigate]);

  useEffect(() => {
    // Fetch balances for all tokens on chain 2
    const fetchBalances = async () => {
      if (!agentData?.agent_wallet) return;

      setLoadingBalance(true);
      try {
        const accountName = agentData.agent_wallet;
        console.log("Fetching balances for account:", accountName);

        // Fetch all token balances on chain 2
        const tokenBalances = await getAllBalances(accountName, "2");
        console.log("Fetched balances:", tokenBalances);

        setBalances(tokenBalances);
        setLoadingBalance(false);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setBalances([]);
        setLoadingBalance(false);
      }
    };

    fetchBalances();
  }, [agentData?.agent_wallet]);

  useEffect(() => {
    // Update deployment status based on agent_deployed flag and KDA balance
    const updateDeploymentStatus = () => {
      if (!agentData) return;

      const isDeployed = agentData.agent_deployed;
      const kdaBalance = balances.find((b) => b.symbol === "KDA")?.balance || 0;
      const hasMinimumKDA = kdaBalance >= 0.5;

      // Don't update status if currently deploying
      if (isDeploying) return;

      if (isDeployed) {
        setDeploymentStatus("Agent deployed successfully!");
      } else if (!hasMinimumKDA) {
        setDeploymentStatus("Waiting for minimum 0.1 KDA deposit");
      } else {
        setDeploymentStatus("Ready to deploy - minimum KDA requirement met");
      }
    };

    updateDeploymentStatus();
  }, [agentData, balances, isDeploying]);

  // Fetch agent logs
  const fetchAgentLogs = async () => {
    if (!agentData?.agent_deployed || !agentId) return;

    setLoadingLogs(true);
    setLogsError(null);

    try {
      const response = await fetch(
        `https://api.agentk.tech/agent-logs/${agentId}/tail?lines=10000`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_COMMUNE_API_KEY || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.logs && data.logs.events) {
        // Sort events by timestamp (newest first)
        const sortedEvents = data.logs.events.sort(
          (a, b) => b.timestamp - a.timestamp
        );
        setLogs(sortedEvents);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching agent logs:", error);
      setLogsError(error.message);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    // Fetch logs when agent is deployed
    if (agentData?.agent_deployed) {
      fetchAgentLogs();
    }
  }, [agentData?.agent_deployed, agentId]);

  // Fetch agent transactions using Tatum API
  const fetchAgentTransactions = async () => {
    if (!agentData?.agent_wallet) return;

    setLoadingTransactions(true);
    setTransactionsError(null);

    try {
      // Use the wallet address directly (it should already be in the correct format)
      const accountName = encodeURIComponent(agentData.agent_wallet);

      console.log("Account Name:", agentData.agent_wallet);

      // Use Tatum API to get Kadena transactions
      const response = await fetch(
        `https://api.tatum.io/v4/data/transactions/kadena?accountName=${agentData.agent_wallet}&chainId=2`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": API_KEYS.TATUM,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("Tatum API Response:", data);

      // Transform Tatum API response to match our expected format
      if (
        data &&
        data.data &&
        data.data.transactions &&
        data.data.transactions.edges
      ) {
        const transformedTransactions = data.data.transactions.edges.map(
          (edge, index) => {
            const tx = edge.node;
            return {
              node: {
                hash: tx.hash || `tx_${index}`,
                cmd: {
                  meta: {
                    chainId: tx.cmd?.meta?.chainId || 2,
                    gasPrice: tx.cmd?.meta?.gasPrice || 0.000001,
                    sender: tx.cmd?.meta?.sender || agentData.agent_wallet,
                    creationTime: tx.cmd?.meta?.creationTime,
                    gasLimit: tx.cmd?.meta?.gasLimit,
                    ttl: tx.cmd?.meta?.ttl,
                  },
                  payload: tx.cmd?.payload,
                  nonce: tx.cmd?.nonce,
                  signers: tx.cmd?.signers,
                },
                result: tx.result,
                sigs: tx.sigs,
              },
              // Add additional Tatum-specific fields
              tatumData: {
                timestamp: tx.cmd?.meta?.creationTime,
                status: tx.result?.badResult ? "FAILED" : "SUCCESS",
                gas: tx.result?.gas,
                events: tx.result?.events,
              },
            };
          }
        );

        setTransactions(transformedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching agent transactions:", error);
      setTransactionsError(error.message);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    // Fetch transactions when agent data is loaded
    if (agentData?.agent_wallet) {
      fetchAgentTransactions();
    }
  }, [agentData?.agent_wallet]);

  // Deploy agent function
  const deployAgent = async () => {
    if (!agentData) return;

    setIsDeploying(true);
    setDeploymentStatus("Creating Agent...");

    try {
      setDeploymentStatus("Writing code...");

      console.log("Agent data:", agentData.prompt);

      // Call the kadena-trader API /code endpoint directly
      const response = await fetch(`${API_ENDPOINTS.KADENA_TRADER}/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: agentData.prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI code: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("AI Code Response:", data["code"]);
      console.log("AI Code Response:", data["interval"]);

      const baselineFunction = data["code"];
      const intervalFunction = data["interval"];
      const agentId = agentData.id;
      const publicKey = agentData.agent_pubkey;
      const privateKey = agentData.agent_privatekey;

      setDeploymentStatus("Deploying Agent to AWS...");

      const deployResponse = await fetch(
        `https://api.agentk.tech/deploy-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key":
              process.env.REACT_APP_COMMUNE_API_KEY || "Commune_dev1",
          },
          body: JSON.stringify({
            agentId: agentId,
            baselineFunction: baselineFunction,
            intervalFunction: intervalFunction,
            publicKey: publicKey,
            privateKey: privateKey,
          }),
        }
      );

      if (!deployResponse.ok) {
        throw new Error(`Failed to deploy agent: ${deployResponse.statusText}`);
      }

      const deployData = await deployResponse.json();
      console.log("Agent deployed successfully to AWS");

      setDeploymentStatus("Saving Agent to Supabase...");

      // Update the agent as deployed in Supabase
      const { error: updateError } = await supabase
        .from("kadena-agents")
        .update({
          agent_deployed: true,
          agent_aws: deployData.agentUrl || "", // Store the generated code
        })
        .eq("id", agentId);

      if (updateError) {
        throw new Error(`Failed to update agent: ${updateError.message}`);
      }

      // Update local state
      setAgentData((prev) => ({
        ...prev,
        agent_deployed: true,
        agent_aws: data.code || "",
      }));

      setDeploymentStatus("Agent deployed successfully!");
    } catch (error) {
      console.error("Deployment error:", error);
      setDeploymentStatus(`Deployment failed: ${error.message}`);
      alert(`Failed to deploy agent: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyToClipboard = (text, event) => {
    navigator.clipboard.writeText(text).then(() => {
      // Add visual feedback
      if (event && event.target) {
        const button = event.target.closest(".agent-copy-button");
        if (button) {
          button.classList.add("copied");
          setTimeout(() => {
            button.classList.remove("copied");
          }, 1000);
        }
      }
    });
  };

  const handleExportPrivateKey = () => {
    if (!agentData?.agent_privatekey) {
      alert("Private key not available");
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([agentData.agent_privatekey], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = `agent-${agentData.id}-private-key.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // Show confirmation
    alert(
      "Private key has been downloaded. Keep it secure and never share it!"
    );
  };

  const formatPublicKey = (publicKey) => {
    if (!publicKey) return "";
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatTransactionHash = (hash) => {
    if (!hash) return "";
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const extractTransactionDetails = (payload) => {
    if (!payload?.data) return null;

    try {
      const data = JSON.parse(payload.data);

      // Check for different transaction types based on the code
      if (payload.code?.includes("kaddex.exchange.swap")) {
        return {
          type: "Kaddex Swap",
          token0Amount: data.token0Amount,
          token1Amount: data.token1Amount,
          token0AmountWithSlippage: data.token0AmountWithSlippage,
        };
      } else if (payload.code?.includes("coin.transfer")) {
        return {
          type: "KDA Transfer",
          amount: data.amount,
          receiver: data.receiver,
        };
      } else if (payload.code?.includes("kaddex.kdx.transfer")) {
        return {
          type: "KDX Transfer",
          amount: data.amount,
          receiver: data.receiver,
        };
      } else if (payload.code?.includes("coin.GAS")) {
        return {
          type: "Gas Payment",
        };
      }

      // Generic transaction type detection
      return {
        type: "Transaction",
        code: payload.code?.substring(0, 50) + "...",
      };
    } catch (error) {
      return null;
    }
  };

  // Add withdraw function
  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress || !agentData) {
      setWithdrawError("Please fill in all fields");
      return;
    }

    // Validate amount
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }

    // Validate k: address format
    if (!withdrawAddress.startsWith("k:") || withdrawAddress.length !== 66) {
      setWithdrawError(
        "Please enter a valid k: address (66 characters starting with 'k:')"
      );
      return;
    }

    // Check if user has enough balance
    const tokenBalance = balances.find(
      (b) =>
        (selectedToken === "coin" && b.symbol === "KDA") ||
        (selectedToken !== "coin" && b.symbol === tokens[selectedToken]?.symbol)
    );

    if (!tokenBalance || tokenBalance.balance < amount) {
      setWithdrawError("Insufficient balance");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      // Create the transfer transaction
      const transferResponse = await fetch(
        "https://kadena-agents.onrender.com/transfer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_COMMUNE_API_KEY || "",
          },
          body: JSON.stringify({
            tokenAddress: selectedToken,
            sender: agentData.agent_wallet,
            receiver: withdrawAddress,
            amount: amount.toString(),
            chainId: "2",
            gasLimit: 2500,
            gasPrice: 0.00000001,
            ttl: 600,
          }),
        }
      );

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json();
        throw new Error(
          errorData.error || "Failed to create transfer transaction"
        );
      }

      const transferData = await transferResponse.json();
      console.log("Transfer transaction created successfully");

      // Replicate the exact baseline signing and submitting approach
      const { createClient } = await import("@kadena/client");
      const { kadenaSignWithKeyPair } = await import("@kadena/hd-wallet");

      // Use the same configuration as baseline
      const chainId = "2";
      const networkId = "mainnet01";
      const rpcUrl = `https://api.chainweb.com/chainweb/0.0/${networkId}/chain/${chainId}/pact`;
      const client = createClient(rpcUrl);

      // Create key pair object exactly like baseline
      const keyPair = {
        secretKey: agentData.agent_privatekey,
        publicKey: agentData.agent_pubkey,
      };

      let transaction = transferData.transaction;

      // Handle nested transaction structure like baseline
      if (transaction["transaction"]) {
        transaction = transaction["transaction"];
      }

      // Sign the transaction exactly like baseline
      console.log("Signing transaction...");
      const password = process.env.REACT_APP_PASSWORD || ""; // Use same password logic as baseline
      const signFn = kadenaSignWithKeyPair(
        password,
        keyPair.publicKey,
        keyPair.secretKey
      );
      const signature = await signFn(transaction.hash);
      console.log("Transaction signed successfully");

      // Create signed transaction exactly like baseline
      const signedTransaction = {
        cmd: transaction.cmd,
        hash: transaction.hash,
        sigs: [signature],
      };

      // Submit the transaction exactly like baseline
      console.log(
        "Submitting transaction to Kadena blockchain:",
        signedTransaction
      );
      let transactionDescriptor;
      try {
        transactionDescriptor = await client.submit(signedTransaction);
      } catch (submitError) {
        throw new Error(`Failed to submit transaction: ${submitError.message}`);
      }

      console.log("Transaction descriptor:", transactionDescriptor);

      // Listen for transaction result exactly like baseline
      let response;
      try {
        response = await client.listen(transactionDescriptor);
      } catch (listenError) {
        throw new Error(
          `Failed to listen for transaction result: ${listenError.message}`
        );
      }

      console.log("Transaction response:", response);

      if (response.result.status === "success") {
        // Show success message
        alert(
          `Withdrawal successful! Transaction hash: ${signedTransaction.hash}`
        );

        // Refresh balances
        const tokenBalances = await getAllBalances(agentData.agent_wallet, "2");
        setBalances(tokenBalances);

        // Close modal and reset form
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawAddress("");
        setSelectedToken("coin");
      } else {
        // Handle error exactly like baseline
        let errorMessage = "Transaction failed";
        let errorDetails = {};

        if (response.result.error) {
          if (typeof response.result.error === "string") {
            errorMessage = response.result.error;
          } else {
            try {
              errorMessage = JSON.stringify(response.result.error);
              errorDetails = response.result.error;
            } catch (e) {
              errorMessage = `Transaction failed: ${
                response.result.error.message || "Unknown error"
              }`;
              errorDetails = { parseError: e.message };
            }
          }
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      setWithdrawError(error.message || "Failed to withdraw funds");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getTokenName = (symbol) => {
    const token = Object.values(tokens).find((t) => t.symbol === symbol);
    return token?.name || symbol;
  };

  const getTokenIcon = (symbol) => {
    const iconMap = {
      KDA: "💎",
      USDC: "💵",
      USDT: "💰",
      ETH: "🔷",
      BTC: "₿",
      WETH: "🔸",
      DAI: "🏛️",
    };
    return iconMap[symbol] || "🪙";
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.01) return "<0.01";
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getStatusClass = () => {
    if (agentData?.agent_deployed) return "active";
    if (isDeploying) return "deploying";
    return "pending";
  };

  if (loading) {
    return (
      <>
        <div className="agent-page-container">
          <div className="agent-loading-state">
            <div className="agent-spinner"></div>
            <span>Loading agent data...</span>
          </div>
        </div>
      </>
    );
  }

  if (!agentData) {
    return (
      <>
        <div className="agent-page-container">
          <div className="agent-loading-state">
            <span>Agent not found</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="agent-page-container">
        <div className="agent-page-content">
          {/* Header */}
          <div className="agent-page-header">
            <button className="agent-back-button" onClick={() => navigate("/")}>
              <ArrowBackIcon />
            </button>
            <h1 className="agent-page-title">Agent Dashboard</h1>
          </div>

          {/* Main Grid */}
          <div className="agent-page-grid">
            {/* Agent Profile & Status */}
            <div className="agent-info-section">
              <h2 className="agent-section-title">Agent Profile</h2>

              <div className="agent-profile-header">
                <div className="agent-profile-avatar">
                  {agentData?.image ? (
                    <img src={agentData.image} alt="Agent profile" />
                  ) : (
                    "🤖"
                  )}
                </div>
                <div className="agent-profile-info">
                  <h3>{agentData?.name || "Trading Agent"}</h3>
                </div>
              </div>

              {agentData?.prompt && (
                <div className="agent-profile-description">
                  <p>{agentData.prompt}</p>
                </div>
              )}

              <div className="agent-status-indicator">
                <div className={`agent-status-dot ${getStatusClass()}`}></div>
                <span className="agent-status-text">{deploymentStatus}</span>
              </div>

              {/* Deploy Button */}
              {!agentData?.agent_deployed &&
                balances.length > 0 &&
                (() => {
                  const kdaBalance =
                    balances.find((b) => b.symbol === "KDA")?.balance || 0;
                  const hasMinimumKDA = kdaBalance >= 0.1;

                  if (hasMinimumKDA) {
                    return (
                      <button
                        className="agent-deploy-button"
                        onClick={deployAgent}
                        disabled={isDeploying}
                      >
                        {isDeploying ? (
                          <>
                            <div className="agent-spinner"></div>
                            Deploying...
                          </>
                        ) : (
                          "Deploy Agent"
                        )}
                      </button>
                    );
                  } else {
                    return (
                      <div className="agent-warning-notice">
                        <p>Deposit at least 0.1 KDA to deploy your agent</p>
                        <div className="balance-info">
                          Current KDA: {kdaBalance.toFixed(2)}
                        </div>
                      </div>
                    );
                  }
                })()}
            </div>

            {/* Wallet Information */}
            <div className="agent-info-section">
              <h2 className="agent-section-title">Wallet Information</h2>

              <div className="agent-wallet-address-field">
                <div className="agent-wallet-address-value">
                  <span className="agent-wallet-address-text">
                    {agentData?.agent_wallet
                      ? `${agentData.agent_wallet.slice(0, 38)}...`
                      : "Loading..."}
                  </span>
                  <button
                    className="agent-copy-button"
                    onClick={(e) =>
                      handleCopyToClipboard(agentData?.agent_wallet, e)
                    }
                  >
                    <ContentCopyIcon fontSize="small" />
                  </button>
                </div>
              </div>

              <div className="agent-data-field">
                <div className="agent-field-label">Public Key</div>
                <div className="agent-field-value">
                  <span className="agent-field-text">
                    {agentData?.agent_pubkey || "Loading..."}
                  </span>
                  <button
                    className="agent-copy-button"
                    onClick={(e) =>
                      handleCopyToClipboard(agentData?.agent_pubkey, e)
                    }
                  >
                    <ContentCopyIcon fontSize="small" />
                  </button>
                </div>
              </div>

              <div className="agent-data-field">
                <div className="agent-field-label">Private Key</div>
                <div className="agent-field-value">
                  <span className="agent-field-text">
                    🔐 Private key is secured and not displayed
                  </span>
                  <button
                    className="agent-export-button"
                    onClick={handleExportPrivateKey}
                  >
                    Export
                  </button>
                </div>
                <div className="agent-field-note">
                  Click Export to download your private key as a secure text
                  file
                </div>
              </div>
            </div>

            {/* Token Balances */}
            <div className="agent-info-section agent-full-width-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <h2 className="agent-section-title" style={{ margin: 0 }}>
                  Token Balances (Chain 2)
                </h2>
                <div className="agent-withdraw-actions">
                  <button
                    className="agent-refresh-button"
                    onClick={async () => {
                      if (!agentData?.agent_wallet) return;
                      setLoadingBalance(true);
                      try {
                        const tokenBalances = await getAllBalances(
                          agentData.agent_wallet,
                          "2"
                        );
                        setBalances(tokenBalances);
                      } catch (error) {
                        console.error("Error refreshing balances:", error);
                      } finally {
                        setLoadingBalance(false);
                      }
                    }}
                    disabled={loadingBalance}
                  >
                    {loadingBalance ? "Refreshing..." : "Refresh"}
                  </button>
                  <button
                    className="agent-withdraw-button"
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              {loadingBalance ? (
                <div className="agent-loading-state">
                  <div className="agent-spinner"></div>
                  <span>Loading balances...</span>
                </div>
              ) : balances.length === 0 ? (
                <div className="agent-empty-state">No token balances found</div>
              ) : (
                <div className="agent-balance-grid">
                  {balances.map((balance, index) => (
                    <div key={index} className="agent-balance-card">
                      <div className="agent-balance-symbol">
                        {getTokenIcon(balance.symbol)} {balance.symbol}
                      </div>
                      <div className="agent-balance-amount">
                        {formatBalance(balance.balance.toString())}
                      </div>
                      <div className="agent-balance-name">
                        {getTokenName(balance.symbol)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Logs */}
            {agentData?.agent_deployed && (
              <div className="agent-info-section agent-full-width-section">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <h2 className="agent-section-title" style={{ margin: 0 }}>
                    Agent Logs
                  </h2>
                  <button
                    className="agent-refresh-button"
                    onClick={fetchAgentLogs}
                    disabled={loadingLogs}
                  >
                    {loadingLogs ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="agent-loading-state">
                    <div className="agent-spinner"></div>
                    <span>Loading logs...</span>
                  </div>
                ) : logsError ? (
                  <div className="agent-error-state">
                    Error loading logs: {logsError}
                  </div>
                ) : logs.length > 0 ? (
                  <div className="agent-logs-container">
                    {logs.map((log, index) => (
                      <div
                        key={log.eventId || index}
                        className="agent-log-entry"
                      >
                        <div className="agent-log-header">
                          <span className="agent-log-timestamp">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <span className="agent-log-stream">
                            {log.logStreamName}
                          </span>
                        </div>
                        <div className="agent-log-message">{log.message}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="agent-empty-state">No logs available yet</div>
                )}
              </div>
            )}

            {/* Transaction History */}
            <div className="agent-info-section agent-full-width-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <h2 className="agent-section-title" style={{ margin: 0 }}>
                  Transaction History
                </h2>
                <button
                  className="agent-refresh-button"
                  onClick={fetchAgentTransactions}
                  disabled={loadingTransactions}
                >
                  {loadingTransactions ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {loadingTransactions ? (
                <div className="agent-loading-state">
                  <div className="agent-spinner"></div>
                  <span>Loading transactions...</span>
                </div>
              ) : transactionsError ? (
                <div className="agent-error-state">
                  Error loading transactions: {transactionsError}
                </div>
              ) : transactions.length > 0 ? (
                <div className="agent-transaction-container">
                  {transactions.map((tx, index) => {
                    const txDetails = extractTransactionDetails(
                      tx.node.cmd.payload
                    );
                    const status = tx.node.result?.badResult
                      ? "failed"
                      : "success";
                    const gasUsed =
                      tx.node.result?.gas || tx.tatumData?.gas || 0;
                    const timestamp =
                      tx.node.cmd.meta.creationTime || tx.tatumData?.timestamp;

                    return (
                      <div
                        key={tx.node.hash}
                        className="agent-transaction-entry"
                      >
                        {/* Transaction Header */}
                        <div className="agent-transaction-header">
                          <div className="agent-transaction-type">
                            {txDetails?.type || "Transaction"}
                          </div>
                          <div className="agent-transaction-status">
                            <div
                              className={`agent-transaction-status-dot ${status}`}
                            ></div>
                            <span>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Main Transaction Info */}
                        <div className="agent-transaction-main-info">
                          {txDetails?.amount && (
                            <div className="agent-transaction-amount">
                              {parseFloat(txDetails.amount).toLocaleString()}{" "}
                              KDA
                            </div>
                          )}
                          {txDetails?.token0Amount &&
                            txDetails?.token1Amount && (
                              <div className="agent-transaction-amount">
                                {parseFloat(
                                  txDetails.token0Amount
                                ).toLocaleString()}{" "}
                                ↔{" "}
                                {parseFloat(
                                  txDetails.token1Amount
                                ).toLocaleString()}
                              </div>
                            )}
                          <div className="agent-transaction-description">
                            {txDetails?.type === "KDA Transfer" &&
                            txDetails?.receiver
                              ? `Transfer to ${txDetails.receiver.slice(
                                  0,
                                  8
                                )}...${txDetails.receiver.slice(-8)}`
                              : txDetails?.type === "Kaddex Swap"
                              ? "Token swap on Kaddex DEX"
                              : txDetails?.type === "KDX Transfer" &&
                                txDetails?.receiver
                              ? `KDX transfer to ${txDetails.receiver.slice(
                                  0,
                                  8
                                )}...${txDetails.receiver.slice(-8)}`
                              : "Blockchain transaction"}
                          </div>
                          {timestamp && (
                            <div
                              style={{
                                fontSize: "0.9rem",
                                color: "rgba(255, 255, 255, 0.6)",
                                marginTop: "0.5rem",
                              }}
                            >
                              {formatTimestamp(timestamp)}
                            </div>
                          )}
                        </div>

                        {/* Participants for transfers */}
                        {(txDetails?.type === "KDA Transfer" ||
                          txDetails?.type === "KDX Transfer") &&
                          txDetails?.receiver && (
                            <div className="agent-transaction-participants">
                              <div className="agent-transaction-participant">
                                <div className="agent-transaction-participant-label">
                                  From
                                </div>
                                <div className="agent-transaction-participant-value">
                                  {tx.node.cmd.meta.sender?.slice(0, 12)}...
                                  {tx.node.cmd.meta.sender?.slice(-12)}
                                </div>
                              </div>
                              <div className="agent-transaction-arrow">→</div>
                              <div className="agent-transaction-participant">
                                <div className="agent-transaction-participant-label">
                                  To
                                </div>
                                <div className="agent-transaction-participant-value">
                                  {txDetails.receiver.slice(0, 12)}...
                                  {txDetails.receiver.slice(-12)}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Transaction Hash */}
                        <div className="agent-transaction-hash">
                          <span className="agent-transaction-hash-label">
                            Transaction Hash:
                          </span>
                          <span
                            className="agent-transaction-hash-value"
                            onClick={(e) =>
                              handleCopyToClipboard(tx.node.hash, e)
                            }
                          >
                            {formatTransactionHash(tx.node.hash)}
                          </span>
                          <button
                            className="agent-copy-button"
                            onClick={(e) =>
                              handleCopyToClipboard(tx.node.hash, e)
                            }
                          >
                            <ContentCopyIcon fontSize="small" />
                          </button>
                        </div>

                        {/* Transaction Details */}
                        <div className="agent-transaction-details">
                          <div className="agent-transaction-detail">
                            <span className="agent-transaction-detail-label">
                              Chain ID
                            </span>
                            <span className="agent-transaction-detail-value">
                              {tx.node.cmd.meta.chainId}
                            </span>
                          </div>
                          <div className="agent-transaction-detail">
                            <span className="agent-transaction-detail-label">
                              Gas Used
                            </span>
                            <span className="agent-transaction-detail-value">
                              {gasUsed.toLocaleString()}
                            </span>
                          </div>
                          <div className="agent-transaction-detail">
                            <span className="agent-transaction-detail-label">
                              Gas Price
                            </span>
                            <span className="agent-transaction-detail-value">
                              {parseFloat(tx.node.cmd.meta.gasPrice).toFixed(8)}
                            </span>
                          </div>
                          <div className="agent-transaction-detail">
                            <span className="agent-transaction-detail-label">
                              Gas Limit
                            </span>
                            <span className="agent-transaction-detail-value">
                              {tx.node.cmd.meta.gasLimit?.toLocaleString() ||
                                "N/A"}
                            </span>
                          </div>
                          {txDetails?.token0AmountWithSlippage && (
                            <div className="agent-transaction-detail">
                              <span className="agent-transaction-detail-label">
                                Slippage Amount
                              </span>
                              <span className="agent-transaction-detail-value">
                                {parseFloat(
                                  txDetails.token0AmountWithSlippage
                                ).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="agent-transaction-detail">
                            <span className="agent-transaction-detail-label">
                              TTL
                            </span>
                            <span className="agent-transaction-detail-value">
                              {tx.node.cmd.meta.ttl || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="agent-empty-state">No transactions found</div>
              )}
            </div>
          </div>
        </div>

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div
            className="agent-modal-overlay"
            onClick={() => setShowWithdrawModal(false)}
          >
            <div
              className="agent-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="agent-modal-header">
                <h3>Withdraw Funds</h3>
                <button
                  className="agent-modal-close"
                  onClick={() => setShowWithdrawModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="agent-modal-body">
                <div className="agent-form-group">
                  <label>Token</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="agent-form-select"
                  >
                    <option value="coin">KDA</option>
                    {Object.entries(tokens).map(([key, token]) => (
                      <option key={key} value={key}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="agent-form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="agent-form-input"
                    step="0.01"
                    min="0"
                  />
                  <div className="agent-form-help">
                    Available:{" "}
                    {(() => {
                      const tokenBalance = balances.find(
                        (b) =>
                          (selectedToken === "coin" && b.symbol === "KDA") ||
                          (selectedToken !== "coin" &&
                            b.symbol === tokens[selectedToken]?.symbol)
                      );
                      return tokenBalance
                        ? formatBalance(tokenBalance.balance.toString())
                        : "0";
                    })()}{" "}
                    {selectedToken === "coin"
                      ? "KDA"
                      : tokens[selectedToken]?.symbol}
                  </div>
                </div>

                <div className="agent-form-group">
                  <label>Recipient Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="k:..."
                    className="agent-form-input"
                  />
                  <div className="agent-form-help">
                    Enter a valid Kadena address (starts with k:)
                  </div>
                </div>

                {withdrawError && (
                  <div className="agent-form-error">{withdrawError}</div>
                )}
              </div>

              <div className="agent-modal-footer">
                <button
                  className="agent-modal-button agent-modal-button-secondary"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={isWithdrawing}
                >
                  Cancel
                </button>
                <button
                  className="agent-modal-button agent-modal-button-primary"
                  onClick={handleWithdraw}
                  disabled={
                    isWithdrawing || !withdrawAmount || !withdrawAddress
                  }
                >
                  {isWithdrawing ? (
                    <>
                      <div className="agent-spinner"></div>
                      Withdrawing...
                    </>
                  ) : (
                    "Withdraw"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AgentPage;
