import React, { useState, useRef, useEffect } from "react";
import Navbar from "../Navbar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./Terminal.css";

function Terminal() {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const terminalRef = useRef(null);
  const { user } = useAuth();

  const fetchAgents = async () => {
    if (!user?.accountName) return;
    setLoadingAgents(true);
    try {
      const { data, error } = await supabase
        .from("agents2")
        .select("id, name, image")

      if (error) throw error;

      setAgents(data || []);
      if (data && data.length > 0) {
        setSelectedAgentId(data[0].id);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchLogsForSelectedAgent = async () => {
    if (!selectedAgentId) return;

    setLoadingLogs(true);
    try {
      const agent = agents.find((a) => a.id === selectedAgentId);
      const { data, error } = await supabase
        .from("terminal2")
        .select("message_id, tweet_content, created_at")
        .eq("agent_id", selectedAgentId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        const formattedLogs = data.map((log) => ({
          type: "output",
          agentId: selectedAgentId,
          agentName: agent?.name,
          content: log.tweet_content,
          timestamp: new Date(log.created_at),
          eventId: log.id,
        }));
        setHistory(formattedLogs);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error(
        `Error fetching logs for agent ${selectedAgentId}:`,
        error
      );
      setHistory([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (user?.accountName) {
      fetchAgents();
    }
  }, [user?.accountName]);

  useEffect(() => {
    if (selectedAgentId) {
      fetchLogsForSelectedAgent();
    } else {
      setHistory([]);
    }
  }, [selectedAgentId, agents]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <>
      <div className="terminal-container">
        <Navbar />

        <div className="terminal-content" ref={terminalRef}>
          <div className="terminal-header">
            <h1 className="terminal-title">Agent Activity Logs</h1>
          </div>

          <div className="terminal-logs-section">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              <h2
                className="agent-section-title"
                style={{
                  margin: 0,
                  color: "#4caf50",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  textShadow: "0 2px 4px rgba(76, 175, 80, 0.3)",
                  letterSpacing: "0.2px",
                  marginRight: "1rem",
                }}
              >
                Live Agent Logs
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexGrow: 1,
                  justifyContent: "center",
                }}
              >
                {loadingAgents ? (
                  <div>Loading agents...</div>
                ) : agents.length > 0 ? (
                  <>
                    {selectedAgent?.image && (
                      <img
                        src={selectedAgent.image}
                        alt={selectedAgent.name}
                        style={{
                          height: "40px",
                          width: "40px",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="agent-selector"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid #4caf50",
                        background: "#333",
                        color: "white",
                        fontSize: "1rem",
                      }}
                    >
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <div>No agents found.</div>
                )}
              </div>
              <button
                className="terminal-refresh-button"
                onClick={fetchLogsForSelectedAgent}
                disabled={loadingLogs || !selectedAgentId}
                style={{ position: "relative", top: "auto", right: "auto" }}
              >
                {loadingLogs ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            {loadingLogs ? (
              <div className="terminal-loading">
                <div
                  className="agent-spinner"
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(76, 175, 80, 0.3)",
                    borderTop: "2px solid #4caf50",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: "0.5rem",
                    display: "inline-block",
                  }}
                ></div>
                Loading your agent logs...
              </div>
            ) : history.length === 0 ? (
              <div className="terminal-no-logs">
                {agents.length === 0 && !loadingAgents
                  ? "No agents found for your account. Create an agent to see logs."
                  : "No logs found for this agent."}
              </div>
            ) : (
              <div className="terminal-logs-container">
                {history.map((entry, index) => (
                  <div
                    key={entry.eventId || index}
                    className="terminal-log-entry"
                  >
                    <div className="terminal-log-header">
                      <div className="terminal-log-info">
                        <span className="terminal-log-agent">
                          {entry.agentName}
                        </span>
                        {entry.logStreamName && (
                          <span className="terminal-log-stream">
                            {entry.logStreamName}
                          </span>
                        )}
                      </div>
                      {entry.timestamp && (
                        <span className="terminal-timestamp">
                          {entry.timestamp.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="terminal-log-message">{entry.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Terminal;
