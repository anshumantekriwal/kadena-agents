import React, { useRef } from "react";

const ImageUploadSlide = ({
  formState,
  updateForm,
  handleFileUpload,
  onNext,
}) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div style={{ width: "90%" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) =>
          handleFileUpload(e, (img) => updateForm("agentImage", img))
        }
        accept="image/*"
        style={{ display: "none" }}
      />
      <button
        onClick={handleUploadClick}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "10px",
          color: "white",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {formState.agentImage ? "Change Image" : "Upload Image"}
      </button>
      {formState.agentImage && (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={URL.createObjectURL(formState.agentImage)}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: "200px",
              objectFit: "contain",
              borderRadius: "10px",
            }}
          />
        </div>
      )}
      <button
        className="next-button"
        onClick={onNext}
        style={{
          marginTop: "1rem",
          width: "100%",
          backgroundColor: "white",
          color: "black",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontWeight: "500",
        }}
      >
        Continue
      </button>
    </div>
  );
};

export default ImageUploadSlide;
