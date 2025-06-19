import React from "react";

const InviteSlide = ({
  formState,
  uiState,
  updateForm,
  updateUI,
  validateInviteCode,
  onNext,
}) => {
  const handleValidateInvite = () => {
    if (
      validateInviteCode(formState.inviteCode, (err) =>
        updateUI("inviteError", err)
      )
    ) {
      onNext();
    }
  };

  return (
    <div style={{ width: "90%" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        Please enter your invitation code to continue
      </p>
      <input
        type="text"
        value={formState.inviteCode}
        onChange={(e) => {
          updateForm("inviteCode", e.target.value);
          updateUI("inviteError", "");
        }}
        placeholder="Enter invite code"
        style={{
          width: "100%",
          padding: "10px 12px",
          marginBottom: "16px",
          backgroundColor: "#1a1a1a",
          border: uiState.inviteError ? "1px solid red" : "none",
          borderRadius: "10px",
          color: "white",
          height: "40px",
          fontSize: "14px",
        }}
      />
      {uiState.inviteError && (
        <p
          style={{
            color: "red",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {uiState.inviteError}
        </p>
      )}
      <button
        className="next-button"
        onClick={handleValidateInvite}
        style={{
          width: "100%",
          backgroundColor: !formState.inviteCode.trim() ? "#666" : "white",
          color: "black",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          cursor: !formState.inviteCode.trim() ? "default" : "pointer",
          fontWeight: "500",
        }}
        disabled={!formState.inviteCode.trim()}
      >
        Continue
      </button>
    </div>
  );
};

export default InviteSlide;
