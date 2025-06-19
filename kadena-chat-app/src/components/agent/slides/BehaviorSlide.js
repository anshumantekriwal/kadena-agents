import React from "react";
import { loadingAnimation } from "../constants";

const BehaviorSlide = ({
  formState,
  uiState,
  updateForm,
  updateUI,
  handleAIRating,
  onNext,
}) => {
  const handleRating = async () => {
    await handleAIRating();
  };

  return (
    <div style={{ width: "90%" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        Describe your agent's behavior and capabilities
      </p>
      <textarea
        value={formState.agentBehavior}
        onChange={(e) => updateForm("agentBehavior", e.target.value)}
        placeholder="Describe what you want your agent to do. Be specific about its trading strategies, risk management, and decision-making process."
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: "#1a1a1a",
          border: "none",
          borderRadius: "10px",
          color: "white",
          minHeight: "150px",
          fontSize: "14px",
          marginBottom: "16px",
          resize: "vertical",
        }}
      />

      <button
        onClick={handleRating}
        disabled={
          !formState.agentBehavior.trim() || uiState.isGeneratingQuestions
        }
        style={{
          width: "100%",
          backgroundColor:
            !formState.agentBehavior.trim() || uiState.isGeneratingQuestions
              ? "#666"
              : "white",
          color: "black",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          cursor:
            !formState.agentBehavior.trim() || uiState.isGeneratingQuestions
              ? "default"
              : "pointer",
          fontWeight: "500",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {uiState.isGeneratingQuestions ? (
          <>
            Analyzing...
            <div style={loadingAnimation} />
          </>
        ) : (
          "Review"
        )}
      </button>

      <button
        onClick={onNext}
        disabled={!uiState.reviewEnabled || uiState.isFetchingAICode}
        style={{
          width: "100%",
          backgroundColor:
            !uiState.reviewEnabled || uiState.isFetchingAICode
              ? "#666"
              : "#222",
          color: "white",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          cursor:
            !uiState.reviewEnabled || uiState.isFetchingAICode
              ? "default"
              : "pointer",
          fontWeight: "500",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        Continue
      </button>

      {uiState.aiRating !== null && (
        <div
          style={{
            color: "white",
            marginBottom: "12px",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          AI Rating:{" "}
          <span
            style={{
              color: uiState.aiRating >= 8 ? "#4caf50" : "#ff9800",
            }}
          >
            {uiState.aiRating} / 10
          </span>
          {uiState.aiJustification && (
            <div
              style={{
                color: "#aaa",
                fontSize: "14px",
                marginTop: "8px",
                fontWeight: 400,
              }}
            >
              <strong>Justification:</strong> {uiState.aiJustification}
            </div>
          )}
        </div>
      )}

      {uiState.followUpQuestions.length > 0 && (
        <div
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              color: "#666",
              marginBottom: "12px",
              fontSize: "14px",
            }}
          >
            follow-up questions:
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "white",
              fontSize: "14px",
            }}
          >
            {uiState.followUpQuestions.map((question, index) => (
              <li key={index} style={{ marginBottom: "8px" }}>
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uiState.aiSteps && uiState.aiSteps.length > 0 && (
        <div
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              color: "#4caf50",
              marginBottom: "12px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Strategy Steps:
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "white",
              fontSize: "14px",
            }}
          >
            {uiState.aiSteps.map((step, index) => (
              <li key={index} style={{ marginBottom: "8px" }}>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BehaviorSlide;
