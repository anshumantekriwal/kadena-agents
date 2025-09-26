import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { supabase } from "../lib/supabase";
import { tokens } from "../utils/tokens";
import Navbar from "./Navbar";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

interface Agent {
  id: string;
  name: string;
  description: string;
  image?: string;
  agent_deployed: boolean;
  agent_wallet?: string;
  agent_privatekey?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { balances, isLoading: balancesLoading } = useWallet();
  const navigate = useNavigate();
  const [userAgents, setUserAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

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
    } catch (err) {
      console.error("Error fetching user agents:", err);
    } finally {
      setLoadingAgents(false);
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
    };
    return iconMap[symbol] || "🪙";
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.01) return "<0.01";
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getAgentAvatar = (agent: Agent) => {
    if (agent.image) {
      return (
        <img src={agent.image} alt={agent.name} className="agent-avatar-img" />
      );
    }
    return agent.name.charAt(0).toUpperCase();
  };

  const getAgentStatus = (agent: Agent) => {
    return agent.agent_deployed ? "Active" : "Pending";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if desired
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const quickActions = [
    {
      title: "Launch New Agent",
      subtitle: "Create and deploy a new AI agent",
      icon: "🚀",
      path: "/agent",
    },
    {
      title: "Start Chat",
      subtitle: "Chat with your AI agents",
      icon: "💬",
      path: "/chat",
    },
  ];

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome back, {user?.email?.split("@")[0] || "User"}
          </h1>
          <p className="dashboard-subtitle">
            Manage your agents and chat
          </p>
        </div>

        {/* Quick Actions Horizontal Container - Moved to bottom */}
        <div className="horizontal-container">
          <h3 className="section-title">Quick Actions</h3>
          <div className="horizontal-scroll">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="horizontal-card action-card"
                onClick={() => navigate(action.path)}
              >
                <div className="card-header">
                  <div className="action-icon-container">
                    <span className="action-icon">{action.icon}</span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="card-title">{action.title}</div>
                  <div className="card-subtitle">{action.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agents Horizontal Container */}
        <div className="horizontal-container">
          <h3 className="section-title">Your Agents</h3>
          {loadingAgents ? (
            <div className="loading-indicator">Loading agents...</div>
          ) : userAgents.length === 0 ? (
            <div className="no-items-message">
              <span className="no-items-icon">🤖</span>
              <span>No agents created yet</span>
              <button
                className="create-item-btn"
                onClick={() => navigate("/agent")}
              >
                Create Your First Agent
              </button>
            </div>
          ) : (
            <div className="horizontal-scroll">
              {userAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="horizontal-card agent-card"
                  onClick={() => navigate(`/agent/${agent.id}`)}
                >
                  <div className="card-header">
                    <div className="agent-avatar">{getAgentAvatar(agent)}</div>
                    <div className="agent-status-container">
                      <div
                        className={`status-dot ${
                          agent.agent_deployed ? "active" : "pending"
                        }`}
                      ></div>
                      <span className="status-text">
                        {getAgentStatus(agent)}
                      </span>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="card-title">{agent.name}</div>
                    <div className="card-description">{agent.description}</div>
                    {agent.agent_wallet && (
                      <div className="card-wallet">
                        <span className="wallet-icon">💼</span>
                        <span
                          className="wallet-address"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(agent.agent_wallet!);
                          }}
                          title="Click to copy wallet address"
                        >
                          {agent.agent_wallet.slice(0, 20)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Token Balances Horizontal Container */}
        <div className="horizontal-container">
          <h3 className="section-title">Token Balances</h3>
          {balancesLoading ? (
            <div className="loading-indicator">Loading balances...</div>
          ) : balances.length === 0 ? (
            <div className="no-items-message">
              <span className="no-items-icon">💰</span>
              <span>No token balances found</span>
              <button
                className="create-item-btn"
                onClick={() => navigate("/wallet")}
              >
                View Wallet Details
              </button>
            </div>
          ) : (
            <div className="horizontal-scroll">
              {balances.map((balance, index) => (
                <div key={index} className="horizontal-card balance-card">
                  <div className="card-header">
                    <div className="token-icon">
                      {getTokenIcon(balance.symbol)}
                    </div>
                    <div className="balance-amount">
                      {formatBalance(balance.balance.toString())}
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="card-title">{balance.symbol}</div>
                    <div className="card-subtitle">
                      {getTokenName(balance.symbol)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
