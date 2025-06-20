import React, { useState, useRef, useEffect } from "react";
import Navbar from "../Navbar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./Terminal.css";

function Terminal() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const terminalRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.accountName) {
      fetchUserAgentLogs();
    }
  }, [user?.accountName]);

  const fetchUserAgentLogs = async () => {
    if (!user?.accountName) return;

    setLoading(true);
    try {
      // First get all deployed agents for the current user
      const { data: userAgents, error: agentsError } = await supabase
        .from("kadena-agents")
        .select("id, name, agent_deployed")
        .eq("user_id", user.accountName)
        .eq("agent_deployed", true);

      if (agentsError) {
        console.error("Error fetching user agents:", agentsError);
        return;
      }

      if (!userAgents || userAgents.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Fetch logs for each deployed agent
      const allLogs = [];

      for (const agent of userAgents) {
        try {
          const response = await fetch(
            `https://api.agentk.tech/agent-logs/${agent.id}`,
            {
              headers: {
                "x-api-key": process.env.REACT_APP_COMMUNE_API_KEY || "",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();

            if (data.logs && data.logs.events) {
              // Transform logs to include agent info
              const agentLogs = data.logs.events.map((event) => ({
                type: "output",
                agentId: agent.id,
                agentName: agent.name,
                content: event.message,
                timestamp: new Date(event.timestamp),
                logStreamName: event.logStreamName,
                eventId: event.eventId,
              }));

              allLogs.push(...agentLogs);
            }
          }
        } catch (error) {
          console.error(`Error fetching logs for agent ${agent.id}:`, error);
        }
      }

      // Sort all logs by timestamp (newest first) and limit to last 100
      const sortedLogs = allLogs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);

      setHistory(sortedLogs);
    } catch (error) {
      console.error("Error fetching user agent logs:", error);
    } finally {
      setLoading(false);
    }
  };

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
                }}
              >
                Live Agent Logs
              </h2>
              <button
                className="terminal-refresh-button"
                onClick={fetchUserAgentLogs}
                disabled={loading}
                style={{ position: "relative", top: "auto", right: "auto" }}
              >
                {loading ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            {loading ? (
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
                No logs found for your deployed agents.
                <br />
                Deploy an agent to see their activity logs here.
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
