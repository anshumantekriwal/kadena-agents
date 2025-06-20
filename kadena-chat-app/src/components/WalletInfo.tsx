import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { tokens } from "../utils/tokens";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./WalletInfo.css";

interface AgentBalance {
  symbol: string;
  balance: string;
}

interface ChainwebBalance {
  [key: string]: number;
}

const WalletInfo: React.FC = () => {
  const { user, logout } = useAuth();
  const { balances, isLoading, error, refreshBalances } = useWallet();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [userAgents, setUserAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentBalances, setAgentBalances] = useState<
    Record<string, AgentBalance[]>
  >({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.accountName) {
      fetchUserAgents();
    }
  }, [user?.accountName]);

  const fetchUserAgents = async () => {
    if (!user?.accountName) return;

    setLoadingAgents(true);
    try {
      const { data, error } = await supabase
        .from("kadena-agents")
        .select("*")
        .eq("user_id", user.accountName);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      setUserAgents(data || []);
      // Fetch balances for each agent
      if (data) {
        const balances: Record<string, AgentBalance[]> = {};
        for (const agent of data) {
          if (agent.agent_wallet) {
            try {
              const response = await fetch(
                `https://api.chainweb.com/chainweb/0.0/mainnet01/chain/2/account/${agent.agent_wallet}/balance`
              );
              const data = (await response.json()) as ChainwebBalance;
              balances[agent.id] = Object.entries(data).map(
                ([symbol, balance]) => ({
                  symbol,
                  balance: balance.toString(),
                })
              );
            } catch (err) {
              console.error(
                `Error fetching balances for agent ${agent.id}:`,
                err
              );
              balances[agent.id] = [];
            }
          }
        }
        setAgentBalances(balances);
      }
    } catch (err) {
      console.error("Error fetching user agents:", err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getTokenName = (symbol: string): string => {
    const token = Object.values(tokens).find((t) => t.symbol === symbol);
    return token?.name || symbol;
  };

  const getTokenIcon = (symbol: string): string => {
    // Map token symbols to appropriate icons
    const iconMap: { [key: string]: string } = {
      KDA: "💎",
      USDC: "💵",
      USDT: "💰",
      ETH: "🔷",
      BTC: "₿",
      WETH: "🔸",
      DAI: "🏛️",
      KDX: "🔥",
      FLUX: "⚡",
      KSWAP: "🔄",
      BABENA: "🍌",
      KDLAUNCH: "🚀",
    };
    return iconMap[symbol] || "🪙";
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.000001) return "<0.000001";
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleViewDashboard = (agentId: string) => {
    navigate(`/agent/${agentId}`);
  };

  const accountName = user?.accountName;
  const publicKey = user?.publicKey;

  if (!accountName || !publicKey) {
    return null;
  }

  return (
    <div className="wallet-page-container">
      <div className="wallet-page-content">
        {/* Header */}
        <div className="wallet-page-header">
          <h1 className="wallet-page-title">Wallet Dashboard</h1>
          <div className="wallet-chain-warning">
            ⚠️ AgentK is on Kadena Chain 2 - Make sure to only deposit on
            mainnet chain 2
          </div>
        </div>

        {/* Main Grid */}
        <div className="wallet-page-grid">
          {/* Account Information */}
          <div className="wallet-info-section wallet-centered-section">
            <h2 className="wallet-section-title">Account Information</h2>
            <div className="wallet-account-details">
              <div className="wallet-data-field">
                <div className="wallet-field-label">Account Name</div>
                <div className="wallet-field-value">
                  <span className="wallet-field-text">{accountName}</span>
                  <button
                    className="wallet-copy-button"
                    onClick={() => copyToClipboard(accountName, "account")}
                  >
                    {copiedText === "account" ? "✓" : "📋"}
                  </button>
                </div>
              </div>
              <div className="wallet-data-field">
                <div className="wallet-field-label">Public Key</div>
                <div className="wallet-field-value">
                  <span className="wallet-field-text">{publicKey}</span>
                  <button
                    className="wallet-copy-button"
                    onClick={() => copyToClipboard(publicKey, "publickey")}
                  >
                    {copiedText === "publickey" ? "✓" : "📋"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Token Balances */}
          <div className="wallet-info-section wallet-full-width-section">
            <div className="wallet-section-header">
              <h2 className="wallet-section-title">Token Balances (Chain 2)</h2>
              <button
                onClick={refreshBalances}
                className="wallet-refresh-button"
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            {isLoading ? (
              <div className="wallet-loading-state">
                <div className="wallet-spinner"></div>
                <span>Loading balances...</span>
              </div>
            ) : error ? (
              <div className="wallet-error-state">Error: {error}</div>
            ) : balances.length === 0 ? (
              <div className="wallet-empty-state">No tokens found</div>
            ) : (
              <div className="wallet-balance-grid">
                {balances.map((balance) => (
                  <div key={balance.symbol} className="wallet-balance-card">
                    <div className="wallet-balance-symbol">
                      {getTokenIcon(balance.symbol)} {balance.symbol}
                    </div>
                    <div className="wallet-balance-amount">
                      {formatBalance(balance.balance.toString())}
                    </div>
                    <div className="wallet-balance-name">
                      {getTokenName(balance.symbol)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Your Agents */}
          <div className="wallet-info-section wallet-full-width-section">
            <h2 className="wallet-section-title">Your Agents</h2>
            {loadingAgents ? (
              <div className="wallet-loading-state">
                <div className="wallet-spinner"></div>
                <span>Loading agents...</span>
              </div>
            ) : userAgents.length === 0 ? (
              <div className="wallet-empty-state">No agents created yet</div>
            ) : (
              <div className="wallet-agents-list">
                {userAgents.map((agent) => (
                  <div key={agent.id} className="wallet-agent-card">
                    <div className="wallet-agent-header">
                      <div className="wallet-agent-avatar">
                        {agent.image ? (
                          <img src={agent.image} alt={agent.name} />
                        ) : (
                          agent.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="wallet-agent-info">
                        <h3 className="wallet-agent-name">{agent.name}</h3>
                        <p className="wallet-agent-description">
                          {agent.description}
                        </p>
                        <div className="wallet-agent-status">
                          <span
                            className={`wallet-status-indicator ${
                              agent.agent_deployed ? "deployed" : "pending"
                            }`}
                          >
                            {agent.agent_deployed
                              ? "✅ Deployed"
                              : "⏳ Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {agent.agent_wallet && (
                      <div className="wallet-agent-field">
                        <div className="wallet-field-label">Agent Wallet</div>
                        <div className="wallet-field-value">
                          <span className="wallet-field-text">
                            {agent.agent_wallet.slice(0, 30)}...
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                agent.agent_wallet,
                                "agent-wallet"
                              )
                            }
                            className="wallet-copy-button"
                          >
                            {copiedText === "agent-wallet" ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>
                    )}

                    {agentBalances[agent.id] &&
                      agentBalances[agent.id].length > 0 && (
                        <div className="wallet-agent-balances">
                          <div className="wallet-field-label">
                            Agent Balances
                          </div>
                          <div className="wallet-agent-balance-list">
                            {agentBalances[agent.id].map((balance) => (
                              <div
                                key={balance.symbol}
                                className="wallet-agent-balance-item"
                              >
                                <div className="wallet-token-icon">
                                  {getTokenIcon(balance.symbol)}
                                </div>
                                <div className="wallet-balance-info">
                                  <span className="wallet-balance-amount">
                                    {formatBalance(balance.balance)}
                                  </span>
                                  <span className="wallet-token-name">
                                    {balance.symbol} •{" "}
                                    {getTokenName(balance.symbol)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    <button
                      onClick={() => handleViewDashboard(agent.id)}
                      className="wallet-dashboard-button"
                    >
                      📊 View Dashboard
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="wallet-info-section wallet-full-width-section">
            <button className="wallet-logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
