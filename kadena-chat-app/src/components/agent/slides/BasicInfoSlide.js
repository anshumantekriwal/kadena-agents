import React from "react";

const BasicInfoSlide = ({ formState, updateForm, onNext }) => {
  return (
    <>
      <p>How should we call your Trading Agent?</p>
      <input
        type="text"
        value={formState.agentName}
        onChange={(e) => updateForm("agentName", e.target.value)}
        placeholder="Enter agent name"
        style={{
          width: "90%",
          padding: "10px 12px",
          marginBottom: "16px",
          backgroundColor: "#1a1a1a",
          border: "none",
          borderRadius: "10px",
          color: "white",
          height: "40px",
          fontSize: "14px",
        }}
      />
      <p>
        {"What should people know about " +
          (formState.agentName || "your agent") +
          "?"}
      </p>
      <textarea
        value={formState.agentDescription}
        onChange={(e) => updateForm("agentDescription", e.target.value)}
        placeholder="Add some description about the agent that everyone will see"
        style={{
          width: "90%",
          padding: "12px",
          marginBottom: "20px",
          backgroundColor: "#1a1a1a",
          border: "none",
          borderRadius: "10px",
          color: "white",
          minHeight: "50%",
          resize: "vertical",
        }}
      />
      <button
        className="next-button"
        onClick={onNext}
        disabled={!formState.agentName.trim()}
        style={{
          marginTop: "1rem",
          width: "100%",
          backgroundColor: !formState.agentName.trim() ? "#666" : "white",
          color: "black",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          cursor: !formState.agentName.trim() ? "default" : "pointer",
          fontWeight: "500",
        }}
      >
        Continue
      </button>
    </>
  );
};

export default BasicInfoSlide;
