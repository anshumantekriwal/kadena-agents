import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { kadenaTraderApi } from "../services/kadenaTraderApi";
import { FILE_SIZE_LIMITS, ERROR_MESSAGES } from "../utils/constants";

export const useTradingAgent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentImage, setAgentImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showAgentLauncher, setShowAgentLauncher] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("trading");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedChains, setSelectedChains] = useState([]);
  const [agentBehavior, setAgentBehavior] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiRating, setAiRating] = useState(null);
  const [aiSteps, setAiSteps] = useState([]);
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [aiJustification, setAiJustification] = useState("");
  const [agentWalletAddress, setAgentWalletAddress] = useState("");
  const [aiCode, setAiCode] = useState("");
  const [interval, setIntervalValue] = useState(null);
  const [isFetchingAICode, setIsFetchingAICode] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const dataSources = [
    "Market data",
    "Social sentiment",
    "News feeds",
    "Financial reports",
    "Trading signals",
    "Economic indicators",
    "Company filings",
    "Technical analysis",
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

  const filteredSources = dataSources.filter((source) =>
    source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChains = chains.filter((chain) =>
    chain.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          setImagesLoaded(true);
        }
      };
    });
    return () => {
      isMounted = false;
    };
  }, []);


  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setShowAgentLauncher(true);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > FILE_SIZE_LIMITS.IMAGE) {
        alert(ERROR_MESSAGES.FILE_TOO_LARGE);
        return;
      }
      setAgentImage(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleStrategySelect = (strategy) => {
    setSelectedStrategy(strategy);
  };

  const handleSourceClick = (source) => {
    setSelectedSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const handleChainClick = (chain) => {
    setSelectedChains((prev) =>
      prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]
    );
  };

  const handleAIRating = async () => {
    if (!agentBehavior.trim()) return;
    setIsGeneratingQuestions(true);
    setAiRating(null);
    setAiSteps([]);
    setFollowUpQuestions([]);
    setReviewEnabled(false);
    setAiJustification("");
    try {
      const prompt =
        "Name: " +
        agentName +
        " Description: " +
        agentDescription +
        " Behavior: " +
        agentBehavior;
      const data = await kadenaTraderApi.getPromptRating({ prompt });

      const { rating, justification, questions } = data.response;
      setAiRating(rating);
      setAiJustification(justification || "");
      setFollowUpQuestions(questions || []);
      setAiSteps([]);
      setReviewEnabled(rating > 7);
      if (rating > 7) {
        localStorage.setItem("agentBehavior", agentBehavior);
        await fetchAICodeAndInterval();
      }
    } catch (error) {
      setAiRating(null);
      setAiSteps([]);
      setFollowUpQuestions([]);
      setReviewEnabled(false);
      setAiJustification("");
      alert(error.message || "Failed to get AI rating");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleCreateAgent = async () => {
    setIsCreating(true);
    try {
      const walletRes = await fetch(
        "https://kadena-wallet-99b8.onrender.com/api/create-wallet"
      );
      if (!walletRes.ok) {
        const errorText = await walletRes.text();
        throw new Error("Failed to generate wallet: " + errorText);
      }
      const walletData = await walletRes.json();
      const { mnemonic, publicKey, privateKey: pkFromWallet } = walletData;

      if (!mnemonic || !publicKey || !pkFromWallet) {
        throw new Error("Invalid wallet data received from API");
      }

      const address = "k:" + publicKey;
      setAgentWalletAddress(address);

      let imageUrl = null;
      if (agentImage) {
        const fileExt = agentImage.name.split(".").pop();
        const filePath = "agent-images/" + Date.now() + "." + fileExt;
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, agentImage, {
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError)
          throw new Error("Image upload failed: " + uploadError.message);
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      if (!user || !user.accountName) {
        alert("You must be logged in to create an agent.");
        return;
      }

      if (!agentName.trim() || !agentBehavior.trim()) {
        alert("Name and behavior are required.");
        return;
      }

      const payload = {
        name: agentName,
        description: agentDescription,
        image: imageUrl,
        user_id: user.accountName,
        trading_agent: true,
        agent_pubkey: publicKey,
        agent_wallet: address,
        agent_privatekey: pkFromWallet,
        prompt: agentBehavior,
      };

      const { data: agentData, error } = await supabase
        .from("agents2")
        .insert([payload])
        .select();

      if (error) {
        throw new Error(
          "Supabase error: " + (error.message || JSON.stringify(error))
        );
      }

      if (!agentData || agentData.length === 0) {
        throw new Error(
          "Agent was not created. Please check your Supabase table and policies."
        );
      }

      const agentId = agentData[0].id;

      if (aiCode && interval) {
        const sanitizedAiCode = sanitizeCode(aiCode);

        try {
          // Append code to baseline's index.js
          const appendCodeRes = await fetch(
            "https://baseline-knuv.onrender.com/append-code",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code: sanitizedAiCode,
                interval: interval,
                agentId: agentId,
                publicKey: publicKey,
                privateKey: pkFromWallet,
              }),
            }
          );

          if (!appendCodeRes.ok) {
            console.error(
              "/append-code API error:",
              await appendCodeRes.text()
            );
          } else {
            console.log("Code successfully appended to baseline index.js");
          }
        } catch (appendError) {
          console.error("Error appending code to baseline:", appendError);
        }

        // Trigger the agent execution
        try {
          const triggerPayload = {
            interval: interval,
            agentId: agentId,
          };
          const triggerRes = await fetch(
            "https://trigger-aeod.onrender.com/schedule",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(triggerPayload),
            }
          );
          if (!triggerRes.ok) {
            console.error("/trigger-aeod API error:", await triggerRes.text());
          }
        } catch (triggerError) {
          console.error("Error calling /trigger-aeod API:", triggerError);
        }
      }

      handleNext();
    } catch (error) {
      alert("Failed to create agent: " + (error.message || "Unknown error"));
    } finally {
      setIsCreating(false);
    }
  };

  const fetchAICodeAndInterval = async () => {
    if (!agentBehavior.trim()) return;
    setIsFetchingAICode(true);
    const sanitizedPrompt = agentBehavior.trim().replace(/\s+/g, " ");
    try {
      const data = await kadenaTraderApi.getAICode({
        agentName,
        agentDescription,
        agentBehavior: sanitizedPrompt,
        selectedSources,
        selectedChains,
      });

      setAiCode(data.code || "");
      setIntervalValue(data.interval || null);
    } catch (error) {
      setAiCode("");
      setIntervalValue(null);
      alert(error.message || "Failed to get code from AI");
    } finally {
      setIsFetchingAICode(false);
    }
  };

  const sanitizeCode = (code) => {
    if (!code) return "";
    let sanitized = code.trim();
    sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    sanitized = sanitized.replace(/^\s*\n+/g, "").replace(/\n+\s*$/g, "");
    sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
    return sanitized;
  };

  return {
    currentStep,
    agentName,
    agentDescription,
    agentImage,
    imageLoaded,
    showAgentLauncher,
    imagesLoaded,
    isCreating,
    selectedStrategy,
    searchTerm,
    selectedSources,
    selectedChains,
    agentBehavior,
    followUpQuestions,
    isGeneratingQuestions,
    aiRating,
    aiSteps,
    reviewEnabled,
    aiJustification,
    agentWalletAddress,
    aiCode,
    interval,
    isFetchingAICode,
    containerRef,
    fileInputRef,
    dataSources,
    chains,
    filteredSources,
    filteredChains,
    setAgentName,
    setAgentDescription,
    setAgentBehavior,
    setSearchTerm,
    handleNext,
    handleBack,
    handleFileUpload,
    handleUploadClick,
    handleStrategySelect,
    handleSourceClick,
    handleChainClick,
    handleAIRating,
    handleCreateAgent,
  };
};
