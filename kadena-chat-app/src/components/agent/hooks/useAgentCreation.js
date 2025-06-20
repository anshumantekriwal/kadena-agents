import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { kadenaTraderApi } from "../../../services/kadenaTraderApi";
import { FILE_SIZE_LIMITS, ERROR_MESSAGES } from "../../../utils/constants";

export const useAgentCreation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const validateInviteCode = (inviteCode, setError) => {
    if (inviteCode.toLowerCase() === "harshal") {
      setError("");
      return true;
    } else {
      setError("Invalid invite code. Please try again.");
      return false;
    }
  };

  const handleFileUpload = (event, setAgentImage) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > FILE_SIZE_LIMITS.IMAGE) {
        alert(ERROR_MESSAGES.FILE_TOO_LARGE);
        return;
      }
      setAgentImage(file);
    }
  };

  const handleAIRating = async (
    agentBehavior,
    agentName,
    agentDescription,
    setUIState
  ) => {
    if (!agentBehavior.trim()) return;

    setUIState((prev) => ({
      ...prev,
      isGeneratingQuestions: true,
      aiRating: null,
      aiSteps: [],
      followUpQuestions: [],
      reviewEnabled: false,
      aiJustification: "",
    }));

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

      setUIState((prev) => ({
        ...prev,
        aiRating: rating,
        aiJustification: justification || "",
        followUpQuestions: questions || [],
        reviewEnabled: rating > 6,
      }));

      // Store the prompt for later use
      if (rating > 6) {
        localStorage.setItem("agentBehavior", agentBehavior);
      }
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        aiRating: null,
        aiSteps: [],
        followUpQuestions: [],
        reviewEnabled: false,
        aiJustification: "",
      }));
      alert(error.message || "Failed to get AI rating");
    } finally {
      setUIState((prev) => ({ ...prev, isGeneratingQuestions: false }));
    }
  };

  const fetchAICodeAndInterval = async (
    agentBehavior,
    agentName,
    agentDescription,
    selectedSources,
    selectedChains,
    setUIState
  ) => {
    if (!agentBehavior.trim()) return;

    setUIState((prev) => ({ ...prev, isFetchingAICode: true }));
    const sanitizedPrompt = agentBehavior.trim().replace(/\s+/g, " ");

    try {
      const data = await kadenaTraderApi.getAICode({
        agentName,
        agentDescription,
        agentBehavior: sanitizedPrompt,
        selectedSources,
        selectedChains,
      });

      console.log("AI /code response:", data);
      setUIState((prev) => ({
        ...prev,
        aiCode: data.code || "",
        interval: data.interval || null,
      }));
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        aiCode: "",
        interval: null,
      }));
      alert(error.message || "Failed to get code from AI");
    } finally {
      setUIState((prev) => ({ ...prev, isFetchingAICode: false }));
    }
  };

  const handleCreateKeypair = async (formState, uiState, setUIState) => {
    console.log("handleCreateKeypair called");
    setUIState((prev) => ({ ...prev, isCreating: true }));

    try {
      // 1. Generate wallet keypair
      const walletRes = await fetch(
        "https://kadena-wallet-1.onrender.com/api/create-wallet"
      );
      if (!walletRes.ok) {
        const errorText = await walletRes.text();
        console.error("Wallet generation failed:", errorText);
        throw new Error("Failed to generate wallet: " + errorText);
      }
      const walletData = await walletRes.json();
      const { mnemonic, publicKey, privateKey: pkFromWallet } = walletData;

      if (!mnemonic || !publicKey || !pkFromWallet) {
        console.error("Invalid wallet data received: Missing required fields");
        throw new Error("Invalid wallet data received from API");
      }
      console.log("Wallet generated successfully for public key:", publicKey);

      const address = "k:" + publicKey;

      // 2. Upload image if present
      let imageUrl = null;
      if (formState.agentImage) {
        const fileExt = formState.agentImage.name.split(".").pop();
        const filePath = "agent-images/" + Date.now() + "." + fileExt;
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, formState.agentImage, {
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

      // 3. Get current user session
      if (!user || !user.accountName) {
        alert("You must be logged in to create an agent.");
        setUIState((prev) => ({ ...prev, isCreating: false }));
        return;
      }

      // 4. Validate required fields
      if (!formState.agentName.trim() || !formState.agentBehavior.trim()) {
        alert("Name and behavior are required.");
        setUIState((prev) => ({ ...prev, isCreating: false }));
        return;
      }

      // 5. Prepare insert payload for Supabase
      const payload = {
        name: formState.agentName,
        description: formState.agentDescription,
        image: imageUrl,
        user_id: user.accountName,
        prompt: formState.agentBehavior,
        agent_wallet: address,
        agent_pubkey: publicKey,
        agent_privatekey: pkFromWallet,
        agent_deployed: false,
        data_sources: "",
        agent_aws: "",
      };

      // 6. Insert into Supabase
      const { data: agentData, error } = await supabase
        .from("kadena-agents")
        .insert([payload])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Supabase error: " + (error.message || JSON.stringify(error)));
        setUIState((prev) => ({ ...prev, isCreating: false }));
        return;
      }

      if (!agentData || agentData.length === 0) {
        alert(
          "Agent was not created. Please check your Supabase table and policies."
        );
        setUIState((prev) => ({ ...prev, isCreating: false }));
        return;
      }

      // Success! Navigate to the agent page
      const agentId = agentData[0].id;
      console.log("Agent created successfully:", agentId);
      navigate(`/agent/${agentId}`);
    } catch (error) {
      console.error("Error creating keypair:", error);
      alert("Failed to create keypair: " + (error.message || "Unknown error"));
    } finally {
      setUIState((prev) => ({ ...prev, isCreating: false }));
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
    validateInviteCode,
    handleFileUpload,
    handleAIRating,
    fetchAICodeAndInterval,
    handleCreateKeypair,
    sanitizeCode,
  };
};
