import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import "./SocialAgentLauncher.css";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import { tokens } from "../../utils/tokens";
import { supabase } from "../../lib/supabase";
import { getAllBalances } from "../../utils/transactions";
import { API_ENDPOINTS, API_KEYS } from "../../utils/constants";

const AgentPage = () => {
  const { agentId } = useParams();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
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
        `https://api.agentk.tech/agent-logs/${agentId}`,
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
      console.log("Deploy Response:", deployData);

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

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatPrivateKey = (privateKey) => {
    if (!privateKey) return "";
    return showPrivateKey ? privateKey : "•".repeat(privateKey.length);
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="agent-launcher-container">
          <div className="agent-launcher-loading">
            <div className="cool-spinner"></div>
            <div className="cool-loading-text">Loading agent data...</div>
          </div>
        </div>
      </>
    );
  }

  if (!agentData) {
    return (
      <>
        <Navbar />
        <div className="agent-launcher-container">
          <div className="agent-launcher-loading">
            <div className="cool-loading-text">Agent not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="agent-launcher-container">
        <IconButton
          className="back-button"
          onClick={() => navigate(-1)}
          sx={{
            color: "white",
            position: "absolute",
            top: "20px",
            left: "40px",
            zIndex: 1,
            "@media (max-width: 768px)": {
              display: "none",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="slide-container"
        >
          <div className="slide-content">
            <div
              className="content-container"
              style={{ width: "90%", maxWidth: "600px" }}
            >
              <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>
                Agent Dashboard
              </h2>

              {/* Agent Info */}
              <div
                style={{
                  backgroundColor: "#111",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  {agentData?.image ? (
                    <img
                      src={agentData.image}
                      alt="Agent profile"
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        backgroundColor: "#1a1a1a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                      }}
                    >
                      🤖
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, marginBottom: "4px" }}>
                      {agentData?.name || "Trading Agent"}
                    </h3>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                      {agentData?.description || "AI Trading Agent"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deployment Status */}
              <div
                style={{
                  backgroundColor: "#111",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h4
                  style={{ margin: 0, marginBottom: "16px", color: "#4caf50" }}
                >
                  Deployment Status
                </h4>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: deploymentStatus.includes("successfully")
                        ? "#4caf50"
                        : isDeploying || deploymentStatus.includes("Deploying")
                        ? "#2196f3"
                        : "#ff9800",
                      animation: !deploymentStatus.includes("successfully")
                        ? "pulse 2s infinite"
                        : "none",
                    }}
                  />
                  <span style={{ color: "white" }}>{deploymentStatus}</span>
                </div>

                {/* Deploy Button - Show when ready to deploy */}
                {!agentData?.agent_deployed &&
                  balances.length > 0 &&
                  (() => {
                    const kdaBalance =
                      balances.find((b) => b.symbol === "KDA")?.balance || 0;
                    const hasMinimumKDA = kdaBalance >= 0.1;

                    if (hasMinimumKDA) {
                      return (
                        <button
                          onClick={deployAgent}
                          disabled={isDeploying}
                          style={{
                            width: "100%",
                            backgroundColor: isDeploying ? "#666" : "#4caf50",
                            color: "white",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: isDeploying ? "default" : "pointer",
                            fontWeight: "500",
                            fontSize: "16px",
                            marginTop: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          {isDeploying ? (
                            <>
                              Deploying...
                              <div
                                className="cool-spinner"
                                style={{
                                  width: "16px",
                                  height: "16px",
                                }}
                              />
                            </>
                          ) : (
                            "Deploy Agent"
                          )}
                        </button>
                      );
                    } else {
                      return (
                        <div
                          style={{
                            backgroundColor: "#1a1a1a",
                            padding: "12px",
                            borderRadius: "8px",
                            marginTop: "16px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              color: "#ff9800",
                              margin: 0,
                              fontSize: "14px",
                            }}
                          >
                            Deposit at least 0.1 KDA to deploy your agent
                          </p>
                          <p
                            style={{
                              color: "#666",
                              margin: "4px 0 0 0",
                              fontSize: "12px",
                            }}
                          >
                            Current KDA: {kdaBalance.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                  })()}
              </div>

              {/* Wallet Information */}
              <div
                style={{
                  backgroundColor: "#111",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h4
                  style={{ margin: 0, marginBottom: "20px", color: "#4caf50" }}
                >
                  Wallet Information
                </h4>

                {/* Public Key */}
                <div style={{ marginBottom: "20px" }}>
                  <p
                    style={{
                      color: "#666",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    Public Key:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#1a1a1a",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        flex: 1,
                        wordBreak: "break-all",
                      }}
                    >
                      {agentData?.agent_pubkey || "Loading..."}
                    </span>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleCopyToClipboard(agentData?.agent_pubkey)
                      }
                      style={{ color: "#666" }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>

                {/* Private Key */}
                <div style={{ marginBottom: "20px" }}>
                  <p
                    style={{
                      color: "#666",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    Private Key:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#1a1a1a",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        flex: 1,
                        wordBreak: "break-all",
                      }}
                    >
                      {formatPrivateKey(agentData?.agent_privatekey) ||
                        "Loading..."}
                    </span>
                    <IconButton
                      size="small"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      style={{ color: "#666" }}
                    >
                      {showPrivateKey ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                    {showPrivateKey && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleCopyToClipboard(agentData?.agent_privatekey)
                        }
                        style={{ color: "#666" }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                </div>

                {/* Wallet Address */}
                <div style={{ marginBottom: "20px" }}>
                  <p
                    style={{
                      color: "#666",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    Wallet Address:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#1a1a1a",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        flex: 1,
                        wordBreak: "break-all",
                      }}
                    >
                      {agentData?.agent_wallet || "Loading..."}
                    </span>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleCopyToClipboard(agentData?.agent_wallet)
                      }
                      style={{ color: "#666" }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              </div>

              {/* Balance Information */}
              <div
                style={{
                  backgroundColor: "#111",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h4
                  style={{ margin: 0, marginBottom: "16px", color: "#4caf50" }}
                >
                  Token Balances (Chain 2)
                </h4>
                {loadingBalance ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px",
                    }}
                  >
                    <div
                      className="cool-spinner"
                      style={{
                        width: "20px",
                        height: "20px",
                        marginRight: "10px",
                      }}
                    />
                    <span style={{ color: "#666" }}>Loading balances...</span>
                  </div>
                ) : balances.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {balances.map((tokenBalance, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          backgroundColor: "#1a1a1a",
                          borderRadius: "8px",
                        }}
                      >
                        <span style={{ color: "#666", fontSize: "14px" }}>
                          {tokenBalance.symbol}:
                        </span>
                        <span
                          style={{
                            color: "white",
                            fontSize: "16px",
                            fontWeight: "bold",
                            fontFamily: "monospace",
                          }}
                        >
                          {tokenBalance.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    No token balances found on Chain 2
                  </div>
                )}
              </div>

              {/* Agent Logs - Only show if agent is deployed */}
              {agentData?.agent_deployed && (
                <div
                  style={{
                    backgroundColor: "#111",
                    borderRadius: "16px",
                    padding: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <h4 style={{ margin: 0, color: "#4caf50" }}>Agent Logs</h4>
                    <button
                      onClick={fetchAgentLogs}
                      disabled={loadingLogs}
                      style={{
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: loadingLogs ? "default" : "pointer",
                        fontSize: "12px",
                        opacity: loadingLogs ? 0.6 : 1,
                      }}
                    >
                      {loadingLogs ? "🔄" : "🔄 Refresh"}
                    </button>
                  </div>

                  {loadingLogs ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                      }}
                    >
                      <div
                        className="cool-spinner"
                        style={{
                          width: "20px",
                          height: "20px",
                          marginRight: "10px",
                        }}
                      />
                      <span style={{ color: "#666" }}>Loading logs...</span>
                    </div>
                  ) : logsError ? (
                    <div
                      style={{
                        backgroundColor: "#1a1a1a",
                        padding: "16px",
                        borderRadius: "8px",
                        color: "#ff6b6b",
                        fontSize: "14px",
                      }}
                    >
                      Error loading logs: {logsError}
                    </div>
                  ) : logs.length > 0 ? (
                    <div
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        backgroundColor: "#1a1a1a",
                        borderRadius: "8px",
                        padding: "12px",
                      }}
                    >
                      {logs.map((log, index) => (
                        <div
                          key={log.eventId || index}
                          style={{
                            padding: "8px 0",
                            borderBottom:
                              index < logs.length - 1
                                ? "1px solid #333"
                                : "none",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{ color: "#4caf50", fontSize: "10px" }}
                            >
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <span style={{ color: "#666", fontSize: "10px" }}>
                              {log.logStreamName}
                            </span>
                          </div>
                          <div
                            style={{
                              color: "white",
                              wordBreak: "break-word",
                              lineHeight: "1.4",
                            }}
                          >
                            {log.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        color: "#666",
                        fontSize: "14px",
                      }}
                    >
                      No logs available yet
                    </div>
                  )}
                </div>
              )}

              {/* Transaction History */}
              <div
                style={{
                  backgroundColor: "#111",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <h4 style={{ margin: 0, color: "#4caf50" }}>
                    Transaction History
                  </h4>
                  <button
                    onClick={fetchAgentTransactions}
                    disabled={loadingTransactions}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: loadingTransactions ? "default" : "pointer",
                      fontSize: "12px",
                      opacity: loadingTransactions ? 0.6 : 1,
                    }}
                  >
                    {loadingTransactions ? "🔄" : "🔄 Refresh"}
                  </button>
                </div>

                {loadingTransactions ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px",
                    }}
                  >
                    <div
                      className="cool-spinner"
                      style={{
                        width: "20px",
                        height: "20px",
                        marginRight: "10px",
                      }}
                    />
                    <span style={{ color: "#666" }}>
                      Loading transactions...
                    </span>
                  </div>
                ) : transactionsError ? (
                  <div
                    style={{
                      backgroundColor: "#1a1a1a",
                      padding: "16px",
                      borderRadius: "8px",
                      color: "#ff6b6b",
                      fontSize: "14px",
                    }}
                  >
                    Error loading transactions: {transactionsError}
                  </div>
                ) : transactions.length > 0 ? (
                  <div
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                      backgroundColor: "#1a1a1a",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    {transactions.map((tx, index) => (
                      <div
                        key={tx.node.hash}
                        style={{
                          padding: "12px 0",
                          borderBottom:
                            index < transactions.length - 1
                              ? "1px solid #333"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: "#4caf50",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                Transaction Hash:
                              </span>
                              <span
                                style={{
                                  color: "white",
                                  fontFamily: "monospace",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleCopyToClipboard(tx.node.hash)
                                }
                                title="Click to copy"
                              >
                                {formatTransactionHash(tx.node.hash)}
                              </span>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleCopyToClipboard(tx.node.hash)
                                }
                                style={{ color: "#666", padding: "2px" }}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "8px",
                            fontSize: "11px",
                          }}
                        >
                          <div>
                            <span style={{ color: "#666" }}>Chain ID: </span>
                            <span style={{ color: "white" }}>
                              {tx.node.cmd.meta.chainId}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#666" }}>Gas Price: </span>
                            <span style={{ color: "white" }}>
                              {tx.node.cmd.meta.gasPrice} KDA
                            </span>
                          </div>
                          {tx.tatumData && (
                            <>
                              <div>
                                <span style={{ color: "#666" }}>Status: </span>
                                <span
                                  style={{
                                    color:
                                      tx.tatumData.status === "SUCCESS"
                                        ? "#4caf50"
                                        : tx.tatumData.status === "FAILED"
                                        ? "#ff6b6b"
                                        : "#ff9800",
                                  }}
                                >
                                  {tx.tatumData.status || "UNKNOWN"}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: "#666" }}>
                                  Gas Used:{" "}
                                </span>
                                <span style={{ color: "white" }}>
                                  {tx.tatumData.gas || "0"}
                                </span>
                              </div>
                              {tx.node.cmd.meta.creationTime && (
                                <div>
                                  <span style={{ color: "#666" }}>
                                    Created:{" "}
                                  </span>
                                  <span style={{ color: "white" }}>
                                    {formatTimestamp(
                                      tx.node.cmd.meta.creationTime
                                    )}
                                  </span>
                                </div>
                              )}
                              {tx.node.cmd.meta.gasLimit && (
                                <div>
                                  <span style={{ color: "#666" }}>
                                    Gas Limit:{" "}
                                  </span>
                                  <span style={{ color: "white" }}>
                                    {tx.node.cmd.meta.gasLimit}
                                  </span>
                                </div>
                              )}
                              {tx.node.cmd.payload?.code && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <span style={{ color: "#666" }}>Type: </span>
                                  <span
                                    style={{ color: "white", fontSize: "10px" }}
                                  >
                                    {(() => {
                                      const details = extractTransactionDetails(
                                        tx.node.cmd.payload
                                      );
                                      return details?.type || "Transaction";
                                    })()}
                                  </span>
                                </div>
                              )}
                              {(() => {
                                const details = extractTransactionDetails(
                                  tx.node.cmd.payload
                                );
                                if (!details) return null;

                                switch (details.type) {
                                  case "Kaddex Swap":
                                    return (
                                      <>
                                        <div style={{ gridColumn: "1 / -1" }}>
                                          <span style={{ color: "#666" }}>
                                            Swap:{" "}
                                          </span>
                                          <span
                                            style={{
                                              color: "white",
                                              fontSize: "10px",
                                            }}
                                          >
                                            {details.token0Amount} KDA →{" "}
                                            {details.token1Amount} KDX
                                          </span>
                                        </div>
                                        <div style={{ gridColumn: "1 / -1" }}>
                                          <span style={{ color: "#666" }}>
                                            With Slippage:{" "}
                                          </span>
                                          <span
                                            style={{
                                              color: "white",
                                              fontSize: "10px",
                                            }}
                                          >
                                            {details.token0AmountWithSlippage}{" "}
                                            KDA
                                          </span>
                                        </div>
                                      </>
                                    );
                                  case "KDA Transfer":
                                    return (
                                      <div style={{ gridColumn: "1 / -1" }}>
                                        <span style={{ color: "#666" }}>
                                          Transfer:{" "}
                                        </span>
                                        <span
                                          style={{
                                            color: "white",
                                            fontSize: "10px",
                                          }}
                                        >
                                          {details.amount} KDA to{" "}
                                          {details.receiver?.slice(0, 8)}...
                                        </span>
                                      </div>
                                    );
                                  case "KDX Transfer":
                                    return (
                                      <div style={{ gridColumn: "1 / -1" }}>
                                        <span style={{ color: "#666" }}>
                                          Transfer:{" "}
                                        </span>
                                        <span
                                          style={{
                                            color: "white",
                                            fontSize: "10px",
                                          }}
                                        >
                                          {details.amount} KDX to{" "}
                                          {details.receiver?.slice(0, 8)}...
                                        </span>
                                      </div>
                                    );
                                  case "Gas Payment":
                                    return (
                                      <div style={{ gridColumn: "1 / -1" }}>
                                        <span style={{ color: "#666" }}>
                                          Purpose:{" "}
                                        </span>
                                        <span
                                          style={{
                                            color: "white",
                                            fontSize: "10px",
                                          }}
                                        >
                                          Gas payment for transaction
                                        </span>
                                      </div>
                                    );
                                  case "Transaction":
                                    return (
                                      <div style={{ gridColumn: "1 / -1" }}>
                                        <span style={{ color: "#666" }}>
                                          Code:{" "}
                                        </span>
                                        <span
                                          style={{
                                            color: "white",
                                            fontSize: "10px",
                                          }}
                                        >
                                          {details.code}
                                        </span>
                                      </div>
                                    );
                                  default:
                                    return null;
                                }
                              })()}
                            </>
                          )}
                          <div style={{ gridColumn: "1 / -1" }}>
                            <span style={{ color: "#666" }}>Sender: </span>
                            <span
                              style={{
                                color: "white",
                                fontFamily: "monospace",
                                fontSize: "10px",
                                wordBreak: "break-all",
                              }}
                            >
                              {tx.node.cmd.meta.sender}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    No transactions found for this agent
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default AgentPage;
