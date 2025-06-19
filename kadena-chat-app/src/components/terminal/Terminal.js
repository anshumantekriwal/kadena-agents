import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import Navbar from "../Navbar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const Container = styled.div`
  height: 100%;
  background-color: #000;
  color: #fff;
  font-family: monospace;
  padding: 20px;
  overflow-y: auto;
`;

const Line = styled.div`
  margin-bottom: 16px;
  white-space: pre-wrap;
`;

const Command = styled(Line)`
  color: #64ff64;
  &::before {
    content: "> ";
  }
`;

const Output = styled(Line)`
  color: #fff;
`;

const Timestamp = styled.span`
  color: #666;
  margin-left: 10px;
  font-size: 12px;
`;

const NoLogsMessage = styled.div`
  text-align: center;
  color: #666;
  font-size: 16px;
  margin-top: 50px;
`;

const RefreshButton = styled.button`
  position: fixed;
  top: 100px;
  right: 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  z-index: 1000;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  color: #4caf50;
  margin: 0;
`;

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
      <Navbar />
      <Container ref={terminalRef}>
        <Header>
          <Title>Agent Activity Logs</Title>
        </Header>

        {loading ? (
          <div
            style={{ textAlign: "center", color: "#666", marginTop: "50px" }}
          >
            Loading your agent logs...
          </div>
        ) : history.length === 0 ? (
          <NoLogsMessage>
            No logs found for your deployed agents.
            <br />
            Deploy an agent to see their activity logs here.
          </NoLogsMessage>
        ) : (
          history.map((entry, index) => (
            <div key={index}>
              {entry.type === "input" ? (
                <Command>{entry.content}</Command>
              ) : (
                <Output>
                  <span style={{ color: "#64ff64" }}>
                    {entry.type === "input" ? "> " : `${entry.agentName}: `}
                  </span>
                  {entry.content}
                  {entry.timestamp && (
                    <Timestamp>{entry.timestamp.toLocaleString()}</Timestamp>
                  )}
                </Output>
              )}
            </div>
          ))
        )}
      </Container>
      <RefreshButton onClick={fetchUserAgentLogs} disabled={loading}>
        {loading ? "Refreshing..." : "🔄 Refresh Logs"}
      </RefreshButton>
    </>
  );
}

export default Terminal;
