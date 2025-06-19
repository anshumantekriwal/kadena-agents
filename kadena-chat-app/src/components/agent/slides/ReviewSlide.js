import React from "react";
import { loadingAnimation } from "../constants";

const ReviewSlide = ({ formState, uiState, handleCreateKeypair, onBack }) => {
  const chains = [
    {
      name: "Polygon",
      logo: "https://coin-images.coingecko.com/coins/images/32440/large/polygon.png?1698233684",
    },
    {
      name: "Solana",
      logo: "https://metacore.mobula.io/78ee4d656f4f152a90d733f4eaaa4e1685e25bc654087acdb62bfe494d668976.png",
    },
    {
      name: "Base",
      logo: "https://dd.dexscreener.com/ds-data/chains/base.png",
    },
    {
      name: "Kadena",
      logo: "https://coin-images.coingecko.com/coins/images/3693/large/Social_-_Profile_Picture.png?1723001308",
    },
  ];

  return (
    <div style={{ width: "90%" }}>
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
            marginBottom: "24px",
          }}
        >
          {formState.agentImage ? (
            <img
              src={URL.createObjectURL(formState.agentImage)}
              alt="Agent profile"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#1a1a1a",
              }}
            />
          )}
          <h3 style={{ margin: 0 }}>{formState.agentName}</h3>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#666", marginBottom: "8px" }}>Description:</p>
          <p style={{ margin: 0 }}>{formState.agentDescription}</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#666", marginBottom: "8px" }}>Strategy:</p>
          <p style={{ margin: 0 }}>
            {formState.selectedStrategy === "trading"
              ? "Trading Strategy"
              : "DeFi AI Agent"}
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#666", marginBottom: "8px" }}>Data Sources:</p>
          <p style={{ margin: 0 }}>
            {formState.selectedSources.join(", ") || "No sources selected"}
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#666", marginBottom: "8px" }}>Chains:</p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {formState.selectedChains.map((chain, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#1a1a1a",
                  padding: "8px 12px",
                  borderRadius: "20px",
                }}
              >
                <img
                  src={chains.find((c) => c.name === chain)?.logo}
                  alt={chain}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                  }}
                />
                <span style={{ color: "white", fontSize: "14px" }}>
                  {chain}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#666", marginBottom: "8px" }}>Behavior:</p>
          <p style={{ margin: 0 }}>
            {formState.agentBehavior || "No behavior specified"}
          </p>
        </div>
      </div>

      <button
        className="next-button"
        onClick={() => handleCreateKeypair(formState, uiState)}
        disabled={uiState.isCreating}
        style={{
          width: "100%",
          backgroundColor: uiState.isCreating ? "#666" : "white",
          color: "black",
          marginBottom: "12px",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          cursor: uiState.isCreating ? "default" : "pointer",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {uiState.isCreating ? (
          <>
            Creating your keypair
            <div style={loadingAnimation} />
          </>
        ) : (
          "Start your 7 day free trial"
        )}
      </button>

      <button
        onClick={onBack}
        style={{
          width: "100%",
          backgroundColor: "#1a1a1a",
          border: "none",
          color: "white",
          cursor: "pointer",
          padding: "12px",
          borderRadius: "8px",
        }}
      >
        Change Info
      </button>
    </div>
  );
};

export default ReviewSlide;
