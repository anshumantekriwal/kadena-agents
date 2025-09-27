import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "./SocialAgentLauncher.css";
import { useNavigate } from "react-router-dom";
import AgentLauncher from "./AgentLauncher";
import Navbar from "../Navbar";
import { useAuth } from "../../context/AuthContext";
import { useAgentCreation } from "./hooks/useAgentCreation";

// Import slide components
import BasicInfoSlide from "./slides/BasicInfoSlide";
import ImageUploadSlide from "./slides/ImageUploadSlide";
import BehaviorSlide from "./slides/BehaviorSlide";
import ReviewSlide from "./slides/ReviewSlide";

const TradingAgentLauncher = () => {
  // Consolidated form state
  const [formState, setFormState] = useState({
    currentStep: 0,
    agentName: "",
    agentDescription: "",
    agentImage: null,
    agentBehavior: "",
    selectedStrategy: "trading",
    selectedSources: [],
    selectedChains: [],
  });

  // Consolidated UI state
  const [uiState, setUIState] = useState({
    showAgentLauncher: false,
    isCreating: false,
    imagesLoaded: false,
    isGeneratingQuestions: false,
    isFetchingAICode: false,
    aiRating: null,
    followUpQuestions: [],
    aiSteps: [],
    reviewEnabled: false,
    aiJustification: "",
    aiCode: "",
    interval: null,
  });

  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Business logic hooks
  const {
    handleFileUpload,
    handleAIRating,
    fetchAICodeAndInterval,
    handleCreateKeypair,
    sanitizeCode,
  } = useAgentCreation();

  // Static data
  const slides = [
    {
      image:
        "https://wbsnlpviggcnwqfyfobh.supabase.co/storage/v1/object/public/app//picture2.png",
      title: "It all starts with a name",
      content: "How should we call your Trading Agent?",
      component: BasicInfoSlide,
    },
    {
      image:
        "https://wbsnlpviggcnwqfyfobh.supabase.co/storage/v1/object/public/app//picture3.png",
      title: `Let's upload the picture\nof ${
        formState.agentName || "your agent"
      }`,
      content: "",
      component: ImageUploadSlide,
    },
    {
      image:
        "https://wbsnlpviggcnwqfyfobh.supabase.co/storage/v1/object/public/app//picture4.png",
      title: `What do you want\n${formState.agentName || "your agent"} to do?`,
      content: "Describe your agent's behavior and capabilities",
      component: BehaviorSlide,
    },
    {
      image:
        "https://wbsnlpviggcnwqfyfobh.supabase.co/storage/v1/object/public/app//picture10.png",
      title: "Review",
      content: "",
      component: ReviewSlide,
    },
  ];

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

  // Preload all static images
  useEffect(() => {
    let isMounted = true;
    const urls = [
      ...slides.map((slide) => slide.image),
      ...chains.map((chain) => chain.logo),
    ];
    let loadedCount = 0;
    urls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount === urls.length && isMounted) {
          setUIState((prev) => ({ ...prev, imagesLoaded: true }));
        }
      };
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // State update helpers
  const updateForm = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateUI = (field, value) => {
    setUIState((prev) => ({ ...prev, [field]: value }));
  };

  const setUIBatch = (updates) => {
    setUIState((prev) => ({ ...prev, ...updates }));
  };

  // Navigation handlers
  const handleNext = () => {
    if (formState.currentStep < slides.length - 1) {
      updateForm("currentStep", formState.currentStep + 1);
    }
  };

  const handleBack = () => {
    if (formState.currentStep > 0) {
      updateForm("currentStep", formState.currentStep - 1);
    } else {
      setUIState((prev) => ({ ...prev, showAgentLauncher: true }));
    }
  };

  // Wrapped handlers for slide components
  const wrappedHandleAIRating = () => {
    return handleAIRating(
      formState.agentBehavior,
      formState.agentName,
      formState.agentDescription,
      setUIState
    );
  };

  const wrappedHandleCreateKeypair = () => {
    return handleCreateKeypair(formState, uiState, setUIBatch);
  };

  // Loading state
  if (!uiState.imagesLoaded) {
    return (
      <div className="agent-launcher-loading">
        <div className="cool-spinner"></div>
        <div className="cool-loading-text">
          Loading your Trading Agent experience...
        </div>
      </div>
    );
  }

  // Show AgentLauncher if needed
  if (uiState.showAgentLauncher) {
    return <AgentLauncher />;
  }

  const currentSlide = slides[formState.currentStep];
  const SlideComponent = currentSlide.component;

  return (
    <>
      <Navbar />
      <div className="agent-launcher-container">
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{
              width: ((formState.currentStep + 1) / slides.length) * 100 + "%",
              height: "4px",
              backgroundColor: "#FFFFFF",
              borderRadius: "2px",
              transition: "width 0.3s ease-in-out",
            }}
          />
          <div
            style={{
              color: "white",
              fontSize: "14px",
              marginTop: "8px",
              textAlign: "right",
            }}
          >
            {"Step " + (formState.currentStep + 1) + " of " + slides.length}
          </div>
        </div>

        <IconButton
          className="back-button"
          onClick={handleBack}
          sx={{
            color: "white",
            position: "absolute",
            top: "20px",
            left: "40px",
            zIndex: 1,
            "@media (max-width: 768px)": {
              display: "none",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <AnimatePresence mode="wait">
          <motion.div
            key={formState.currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="slide-container"
          >
            <div className="slide-content">
              <div className="image-container">
                <img
                  src={currentSlide.image}
                  alt={"Step " + (formState.currentStep + 1)}
                  className="slide-image"
                />
              </div>

              <div className="content-container">
                <h2 style={{ marginBottom: "1.5rem" }}>{currentSlide.title}</h2>

                <SlideComponent
                  formState={formState}
                  uiState={uiState}
                  updateForm={updateForm}
                  updateUI={updateUI}
                  handleFileUpload={handleFileUpload}
                  handleAIRating={wrappedHandleAIRating}
                  handleCreateKeypair={wrappedHandleCreateKeypair}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default TradingAgentLauncher;
