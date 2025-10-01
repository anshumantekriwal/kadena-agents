import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "./Navbar";
import "./Leaderboard.css";

interface Agent {
  id: string;
  name: string;
  user_id: string;
  agent_wallet: string;
  image?: string;
}

interface LeaderboardEntry {
  agent: Agent;
  totalTransactions: number;
  totalVolumeKDA: number;
  isLoading: boolean;
  error?: string;
}

interface UserLeaderboardEntry {
  userId: string;
  totalTransactions: number;
  totalVolumeKDA: number;
  agentCount: number;
  isLoading: boolean;
  error?: string;
}

const KADINDEXER_API_URL = "https://graph.kadena.network/graphql";
const CHAIN_IDS = ["2"];

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLeaderboard, setUserLeaderboard] = useState<UserLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"transactions" | "volume">("volume");
  const [viewMode, setViewMode] = useState<"agents" | "users">("agents");

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      console.log("[Leaderboard] Starting to fetch agent data from Supabase...");
      
      // Fetch all agents from Supabase
      const { data: agents, error } = await supabase
        .from("kadena-agents")
        .select("id, name, user_id, agent_wallet, image")
        .not("agent_wallet", "is", null);

      if (error) {
        console.error("[Leaderboard] Supabase error:", error);
        throw error;
      }

      console.log(`[Leaderboard] Fetched ${agents?.length || 0} agents from Supabase`);

      if (!agents || agents.length === 0) {
        setLeaderboard([]);
        setUserLeaderboard([]);
        setIsLoading(false);
        return;
      }

      // Initialize leaderboard entries with loading state
      const initialEntries: LeaderboardEntry[] = agents.map((agent) => ({
        agent,
        totalTransactions: 0,
        totalVolumeKDA: 0,
        isLoading: true,
      }));

      setLeaderboard(initialEntries);

      // Fetch transaction data for each agent in parallel
      console.log("[Leaderboard] Fetching transaction data for all agents...");
      const updatedEntries = await Promise.all(
        agents.map(async (agent, index) => {
          try {
            console.log(`[Leaderboard] [${index + 1}/${agents.length}] Fetching data for agent: ${agent.name} (${agent.agent_wallet})`);
            const { totalTransactions, totalVolume } = await fetchWalletTransactionData(agent.agent_wallet, "agent");
            console.log(`[Leaderboard] [${index + 1}/${agents.length}] Agent ${agent.name}: ${totalTransactions} txs, ${totalVolume.toFixed(2)} KDA`);
            return {
              agent,
              totalTransactions,
              totalVolumeKDA: totalVolume,
              isLoading: false,
            };
          } catch (error) {
            console.error(`[Leaderboard] Error fetching data for agent ${agent.name}:`, error);
            return {
              agent,
              totalTransactions: 0,
              totalVolumeKDA: 0,
              isLoading: false,
              error: "Failed to load",
            };
          }
        })
      );

      setLeaderboard(updatedEntries);
      console.log("[Leaderboard] Agent leaderboard data loaded successfully");

      // Aggregate user data
      console.log("[Leaderboard] Aggregating user leaderboard data...");
      const userMap = new Map<string, { transactions: number; volume: number; agentCount: number }>();
      
      updatedEntries.forEach((entry) => {
        const userId = entry.agent.user_id;
        const existing = userMap.get(userId) || { transactions: 0, volume: 0, agentCount: 0 };
        userMap.set(userId, {
          transactions: existing.transactions + entry.totalTransactions,
          volume: existing.volume + entry.totalVolumeKDA,
          agentCount: existing.agentCount + 1,
        });
      });

      // Also fetch transaction data for user wallets
      console.log("[Leaderboard] Fetching transaction data for user wallets...");
      const uniqueUserIds = Array.from(new Set(agents.map(a => a.user_id)));
      
      const userDataPromises = uniqueUserIds.map(async (userId, index) => {
        try {
          console.log(`[Leaderboard] [${index + 1}/${uniqueUserIds.length}] Fetching data for user: ${userId}`);
          const { totalTransactions, totalVolume } = await fetchWalletTransactionData(userId, "user");
          console.log(`[Leaderboard] [${index + 1}/${uniqueUserIds.length}] User ${userId}: ${totalTransactions} txs, ${totalVolume.toFixed(2)} KDA`);
          
          const existing = userMap.get(userId) || { transactions: 0, volume: 0, agentCount: 0 };
          return {
            userId,
            totalTransactions: totalTransactions + existing.transactions,
            totalVolumeKDA: totalVolume + existing.volume,
            agentCount: existing.agentCount,
            isLoading: false,
          };
        } catch (error) {
          console.error(`[Leaderboard] Error fetching data for user ${userId}:`, error);
          const existing = userMap.get(userId) || { transactions: 0, volume: 0, agentCount: 0 };
          return {
            userId,
            totalTransactions: existing.transactions,
            totalVolumeKDA: existing.volume,
            agentCount: existing.agentCount,
            isLoading: false,
            error: "Failed to load",
          };
        }
      });

      const userEntries = await Promise.all(userDataPromises);
      setUserLeaderboard(userEntries);
      console.log("[Leaderboard] User leaderboard data loaded successfully");
      
    } catch (err) {
      console.error("[Leaderboard] Error fetching leaderboard data:", err);
    } finally {
      setIsLoading(false);
      console.log("[Leaderboard] All data loading complete");
    }
  };

  const fetchWalletTransactionData = async (
    accountName: string, 
    type: "agent" | "user"
  ): Promise<{ totalTransactions: number; totalVolume: number }> => {
    let totalTransactions = 0;
    let totalVolume = 0;

    console.log(`[Kadindexer API] Starting to fetch data for ${type}: ${accountName}`);

    // Query transfers across all chains
    for (const chainId of CHAIN_IDS) {
      try {
        console.log(`[Kadindexer API] [Chain ${chainId}] Querying transfers for ${accountName}...`);
        
        let hasNextPage = true;
        let afterCursor: string | null = null;
        let pageCount = 0;
        let chainTxCount = 0;
        let chainVolume = 0;

        // Paginate through all transfers on this chain
        while (hasNextPage) {
          pageCount++;
          const query = `
            query Transfers($accountName: String!, $chainId: String!, $first: Int, $after: String) {
              transfers(accountName: $accountName, chainId: $chainId, first: $first, after: $after) {
                edges {
                  node {
                    amount
                    senderAccount
                    receiverAccount
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          `;

          const startTime = performance.now();
          const response: Response = await fetch(KADINDEXER_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              variables: {
                accountName,
                chainId,
                first: 1000, // Fetch 1000 transfers per page
                after: afterCursor,
              },
            }),
          });
          const endTime = performance.now();

          console.log(`[Kadindexer API] [Chain ${chainId}] Page ${pageCount} request completed in ${(endTime - startTime).toFixed(2)}ms`);

          if (!response.ok) {
            console.error(`[Kadindexer API] [Chain ${chainId}] Page ${pageCount} HTTP error: ${response.status} ${response.statusText}`);
            break;
          }

          const result: any = await response.json();
          
          if (result.errors) {
            console.error(`[Kadindexer API] [Chain ${chainId}] Page ${pageCount} GraphQL errors:`, result.errors);
            break;
          }

          if (result.data?.transfers?.edges) {
            const transfers = result.data.transfers.edges;
            const pageTxCount = transfers.length;

            // Sum up the transfer amounts
            transfers.forEach((edge: any) => {
              const amount = parseFloat(edge.node.amount) || 0;
              chainVolume += amount;
            });

            chainTxCount += pageTxCount;
            console.log(`[Kadindexer API] [Chain ${chainId}] Page ${pageCount}: Found ${pageTxCount} transfers`);

            // Check if there are more pages
            hasNextPage = result.data.transfers.pageInfo?.hasNextPage || false;
            afterCursor = result.data.transfers.pageInfo?.endCursor || null;

            if (hasNextPage) {
              console.log(`[Kadindexer API] [Chain ${chainId}] Page ${pageCount}: More pages available, continuing pagination...`);
            } else {
              console.log(`[Kadindexer API] [Chain ${chainId}] Page ${pageCount}: No more pages, pagination complete`);
            }
          } else {
            console.log(`[Kadindexer API] [Chain ${chainId}] Page ${pageCount}: No transfer data in response`);
            break;
          }
        }

        // Add chain totals to overall totals
        totalTransactions += chainTxCount;
        totalVolume += chainVolume;

        if (chainTxCount > 0) {
          console.log(`[Kadindexer API] [Chain ${chainId}] TOTAL: ${chainTxCount} transfers across ${pageCount} page(s), volume: ${chainVolume.toFixed(2)} KDA`);
        } else {
          console.log(`[Kadindexer API] [Chain ${chainId}] No transfers found`);
        }
      } catch (error) {
        console.error(`[Kadindexer API] [Chain ${chainId}] Error fetching transfers:`, error);
      }
    }

    console.log(`[Kadindexer API] FINAL TOTAL for ${accountName}: ${totalTransactions} transactions, ${totalVolume.toFixed(2)} KDA volume`);
    return { totalTransactions, totalVolume };
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === "transactions") {
      return b.totalTransactions - a.totalTransactions;
    }
    return b.totalVolumeKDA - a.totalVolumeKDA;
  });

  const sortedUserLeaderboard = [...userLeaderboard].sort((a, b) => {
    if (sortBy === "transactions") {
      return b.totalTransactions - a.totalTransactions;
    }
    return b.totalVolumeKDA - a.totalVolumeKDA;
  });

  const formatVolume = (volume: number): string => {
    if (volume === 0) return "0 KDA";
    if (volume < 0.01) return "<0.01 KDA";
    if (volume < 1) return `${volume.toFixed(4)} KDA`;
    if (volume < 1000) return `${volume.toFixed(2)} KDA`;
    if (volume < 1000000) return `${(volume / 1000).toFixed(2)}K KDA`;
    return `${(volume / 1000000).toFixed(2)}M KDA`;
  };

  const formatNumber = (num: number): string => {
    if (num === 0) return "0";
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const getAgentAvatar = (entry: LeaderboardEntry) => {
    if (entry.agent.image) {
      return (
        <img src={entry.agent.image} alt={entry.agent.name} className="leaderboard-avatar-img" />
      );
    }
    return entry.agent.name.charAt(0).toUpperCase();
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getTotalStats = () => {
    if (viewMode === "agents") {
      const totalTxs = leaderboard.reduce((sum, entry) => sum + entry.totalTransactions, 0);
      const totalVol = leaderboard.reduce((sum, entry) => sum + entry.totalVolumeKDA, 0);
      return { totalTxs, totalVol, count: leaderboard.length };
    } else {
      const totalTxs = userLeaderboard.reduce((sum, entry) => sum + entry.totalTransactions, 0);
      const totalVol = userLeaderboard.reduce((sum, entry) => sum + entry.totalVolumeKDA, 0);
      return { totalTxs, totalVol, count: userLeaderboard.length };
    }
  };

  const stats = getTotalStats();

  return (
    <div className="leaderboard-container">
      <Navbar />
      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">Leaderboard</h1>
          <p className="leaderboard-subtitle">
            Top performing {viewMode === "agents" ? "AI agents" : "users"} by transaction volume and activity
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="view-mode-tabs">
          <button
            className={`view-tab ${viewMode === "agents" ? "active" : ""}`}
            onClick={() => setViewMode("agents")}
          >
            🤖 Agents
          </button>
          <button
            className={`view-tab ${viewMode === "users" ? "active" : ""}`}
            onClick={() => setViewMode("users")}
          >
            👥 Users
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">{viewMode === "agents" ? "🤖" : "👥"}</div>
            <div className="stat-info">
              <div className="stat-value">{stats.count}</div>
              <div className="stat-label">{viewMode === "agents" ? "Active Agents" : "Active Users"}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{formatNumber(stats.totalTxs)}</div>
              <div className="stat-label">Total Transactions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💎</div>
            <div className="stat-info">
              <div className="stat-value">{formatVolume(stats.totalVol)}</div>
              <div className="stat-label">Total Volume</div>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === "volume" ? "active" : ""}`}
            onClick={() => setSortBy("volume")}
          >
            Sort by Volume
          </button>
          <button
            className={`sort-btn ${sortBy === "transactions" ? "active" : ""}`}
            onClick={() => setSortBy("transactions")}
          >
            Sort by Transactions
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-table-container">
          {isLoading && (viewMode === "agents" ? leaderboard.length === 0 : userLeaderboard.length === 0) ? (
            <div className="loading-indicator">Loading leaderboard data...</div>
          ) : viewMode === "agents" ? (
            // Agents Leaderboard
            leaderboard.length === 0 ? (
              <div className="no-items-message">
                <span className="no-items-icon">📊</span>
                <span>No agents with wallets found</span>
              </div>
            ) : (
              <div className="leaderboard-table">
                <div className="table-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-agent">Agent</div>
                  <div className="col-user">User</div>
                  <div className="col-transactions">Transactions</div>
                  <div className="col-volume">Volume (KDA)</div>
                  <div className="col-wallet">Wallet</div>
                </div>
                <div className="table-body">
                  {sortedLeaderboard.map((entry, index) => (
                    <div
                      key={entry.agent.id}
                      className={`table-row ${index < 3 ? "top-three" : ""} ${entry.isLoading ? "loading-row" : ""}`}
                    >
                      <div className="col-rank">
                        <span className="rank-badge">{getRankBadge(index)}</span>
                      </div>
                      <div className="col-agent">
                        <div className="agent-info">
                          <div className="agent-avatar">{getAgentAvatar(entry)}</div>
                          <span className="agent-name">{entry.agent.name}</span>
                        </div>
                      </div>
                      <div className="col-user">
                        <span className="user-id">{entry.agent.user_id.slice(0, 15)}...</span>
                      </div>
                      <div className="col-transactions">
                        {entry.isLoading ? (
                          <span className="loading-text">Loading...</span>
                        ) : entry.error ? (
                          <span className="error-text">{entry.error}</span>
                        ) : (
                          <span className="tx-count">{formatNumber(entry.totalTransactions)}</span>
                        )}
                      </div>
                      <div className="col-volume">
                        {entry.isLoading ? (
                          <span className="loading-text">Loading...</span>
                        ) : entry.error ? (
                          <span className="error-text">-</span>
                        ) : (
                          <span className="volume-amount">{formatVolume(entry.totalVolumeKDA)}</span>
                        )}
                      </div>
                      <div className="col-wallet">
                        <span className="wallet-address" title={entry.agent.agent_wallet}>
                          {entry.agent.agent_wallet.slice(0, 10)}...{entry.agent.agent_wallet.slice(-8)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            // Users Leaderboard
            userLeaderboard.length === 0 ? (
              <div className="no-items-message">
                <span className="no-items-icon">📊</span>
                <span>No users found</span>
              </div>
            ) : (
              <div className="leaderboard-table">
                <div className="table-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-user-wide">User Wallet</div>
                  <div className="col-agents">Agents</div>
                  <div className="col-transactions">Transactions</div>
                  <div className="col-volume">Volume (KDA)</div>
                </div>
                <div className="table-body">
                  {sortedUserLeaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`table-row ${index < 3 ? "top-three" : ""} ${entry.isLoading ? "loading-row" : ""}`}
                    >
                      <div className="col-rank">
                        <span className="rank-badge">{getRankBadge(index)}</span>
                      </div>
                      <div className="col-user-wide">
                        <div className="user-wallet-info">
                          <span className="user-wallet-address" title={entry.userId}>
                            {entry.userId}
                          </span>
                        </div>
                      </div>
                      <div className="col-agents">
                        <span className="agent-count">{entry.agentCount} agent{entry.agentCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="col-transactions">
                        {entry.isLoading ? (
                          <span className="loading-text">Loading...</span>
                        ) : entry.error ? (
                          <span className="error-text">{entry.error}</span>
                        ) : (
                          <span className="tx-count">{formatNumber(entry.totalTransactions)}</span>
                        )}
                      </div>
                      <div className="col-volume">
                        {entry.isLoading ? (
                          <span className="loading-text">Loading...</span>
                        ) : entry.error ? (
                          <span className="error-text">-</span>
                        ) : (
                          <span className="volume-amount">{formatVolume(entry.totalVolumeKDA)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

