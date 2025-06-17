const express = require("express");
const router = express.Router();
const { KADENA_NETWORK_ID } = require("../config");
const { Pact } = require("@kadena/client");
const {
  getClient,
  ensureChainIdString,
  validateChainId,
  creationTime,
  generateTransactionHash,
} = require("../utils");

/**
 * Shared utility functions to reduce code duplication
 */

/**
 * Validates account format
 * @param {string} account - The account to validate
 * @returns {Object} - Validation result with valid flag and error details
 */
const validateAccount = (account) => {
  if (!account || !account.startsWith("k:")) {
    return {
      valid: false,
      error: "Invalid account format",
      details: "Account must start with k:",
    };
  }
  return { valid: true };
};

/**
 * Validates guard format
 * @param {Object} guard - The guard object to validate
 * @returns {Object} - Validation result with valid flag and error details
 */
const validateGuard = (guard) => {
  if (!guard || !guard.keys || !guard.keys.length || !guard.pred) {
    return {
      valid: false,
      error: "Missing required guard parameters",
      details: "Guard must have keys array and pred property",
    };
  }

  if (guard.keys.some((k) => typeof k !== "string" || k.length !== 64)) {
    return {
      valid: false,
      error: "Invalid guard keys",
      details: "Guard keys must be 64-character hex public keys",
    };
  }

  return { valid: true };
};

/**
 * Retrieves account guard from blockchain
 * @param {string} account - The account address
 * @param {string} chainId - The chain ID
 * @returns {Promise<Object>} - Account guard object or error
 */
const getAccountGuard = async (account, chainId) => {
  try {
    const pactClient = getClient(chainId);
    const accountDetailsCmd = Pact.builder
      .execution(`(coin.details "${account}")`)
      .setMeta({
        chainId: ensureChainIdString(chainId),
        sender: account,
        gasLimit: 1000,
        gasPrice: 0.000001,
        ttl: 600,
        creationTime: creationTime(),
      })
      .setNetworkId(KADENA_NETWORK_ID)
      .createTransaction();

    const accountDetailsData = await pactClient.local(accountDetailsCmd, {
      preflight: false,
      signatureVerification: false,
    });

    if (!accountDetailsData?.result?.data?.guard) {
      throw new Error("Account not found");
    }

    return {
      success: true,
      guard: accountDetailsData.result.data.guard,
    };
  } catch (error) {
    console.error(`Error fetching guard for account ${account}:`, error);
    return {
      success: false,
      error: "Account not found",
      details: error.message,
    };
  }
};

/**
 * Creates common transaction metadata
 * @param {string} chainId - The chain ID
 * @param {string} sender - The sender account
 * @returns {Object} - Transaction metadata
 */
const createTxMeta = (chainId, sender) => {
  return {
    chainId: ensureChainIdString(chainId),
    sender,
    gasLimit: 10000,
    gasPrice: 0.0000001,
    ttl: 28800,
    creationTime: creationTime(),
  };
};

/**
 * POST /nft/launch
 * Generates an unsigned NFT creation and minting transaction (Marmalade v2).
 */
router.post("/launch", async (req, res) => {
  try {
    req.logStep("Start NFT launch request");

    const {
      account,
      mintTo,
      uri,
      precision = 0,
      policy = "DEFAULT_COLLECTION_NON_UPDATABLE",
      collectionId,
      royalties = 0,
      royaltyRecipient = null,
      chainId = "2",
      name,
      description,
    } = req.body;

    // Validate required parameters
    const chainIdValidation = validateChainId(chainId);
    if (!chainIdValidation.valid) {
      req.logStep("Invalid chain ID");
      return res.status(400).json({
        error: chainIdValidation.error,
        details: chainIdValidation.details,
      });
    }

    // Validate account and guard
    const accountValidation = validateAccount(account);
    if (!accountValidation.valid) {
      req.logStep("Invalid account format");
      return res.status(400).json({
        error: accountValidation.error,
        details: accountValidation.details,
      });
    }

    // Validate mintTo account
    const mintToValidation = validateAccount(mintTo);
    if (!mintToValidation.valid) {
      req.logStep("Invalid mintTo account");
      return res.status(400).json({
        error: "Invalid mintTo account",
        details: mintToValidation.details,
      });
    }

    // Validate other required fields
    if (!uri || !collectionId) {
      req.logStep("Missing required fields");
      return res.status(400).json({
        error: "Missing required parameters",
        details: "uri and collectionId are required",
      });
    }

    // Validate royalty parameters
    if (policy.includes("ROYALTY")) {
      if (royalties <= 0) {
        req.logStep("Invalid royalty value");
        return res.status(400).json({
          error: "Invalid royalty",
          details: "Royalties must be greater than 0 for royalty policies",
        });
      }

      const royaltyRecipientValidation = validateAccount(royaltyRecipient);
      if (!royaltyRecipientValidation.valid) {
        req.logStep("Invalid royalty recipient");
        return res.status(400).json({
          error: "Missing/Invalid royalty recipient",
          details:
            "royaltyRecipient is required and must start with k: for royalty policies",
        });
      }
    }

    // Extract account guard from k: address
    let accountGuard;
    if (account.startsWith("k:") && account.length === 66) {
      const publicKey = account.substring(2); // Remove "k:" prefix
      accountGuard = {
        keys: [publicKey],
        pred: "keys-all",
      };
      req.logStep("Extracted account guard from k: address");
    } else {
      req.logStep("Invalid account format for NFT creation");
      return res.status(400).json({
        error: "Invalid account format",
        details: "Only k: addresses are supported for NFT creation",
      });
    }

    try {
      const pactClient = getClient(chainId);

      // Generate token ID with proper policy format
      req.logStep("Generating token ID");

      let policyName =
        policy === "DEFAULT_COLLECTION_NON_UPDATABLE"
          ? "marmalade-v2.non-fungible-policy-v1"
          : policy === "DEFAULT_COLLECTION_ROYALTY_NON_UPDATABLE"
          ? "marmalade-v2.royalty-policy-v1"
          : policy;

      const tokenIdCmd = Pact.builder
        .execution(
          `(use marmalade-v2.ledger)(use marmalade-v2.util-v1)
           (create-token-id { 'precision: ${precision}, 'policies: [${policyName}], 'uri: "${uri.trim()}"} (read-keyset 'ks))`
        )
        .setMeta({
          chainId: String(chainId),
          gasLimit: 80000,
          gasPrice: 0.0000001,
        })
        .addKeyset("ks", accountGuard.pred, ...accountGuard.keys)
        .setNetworkId(KADENA_NETWORK_ID)
        .createTransaction();

      const tokenIdResult = await pactClient.dirtyRead(tokenIdCmd);

      if (!tokenIdResult?.result?.data) {
        req.logStep("Failed to generate token ID");
        req.logStep(
          `Token ID error: ${JSON.stringify(tokenIdResult?.result?.error)}`
        );
        throw new Error(
          tokenIdResult?.result?.error?.message || "Failed to generate token ID"
        );
      }

      const tokenId = tokenIdResult.result.data;

      // Construct NFT creation and minting code with consistent keyset
      req.logStep("Building NFT transaction");
      const pactCode = `(use marmalade-v2.ledger)
(use marmalade-v2.util-v1)
(create-token 
  ${JSON.stringify(tokenId)} 
  ${precision} 
  (read-msg 'uri) 
  [${policyName}] 
  (read-keyset 'ks)
) 
(mint 
  ${JSON.stringify(tokenId)} 
  (read-msg 'mintTo) 
  (at 'guard (coin.details (read-msg 'mintTo))) 
  1.0
)`;

      // Prepare environment data
      const envData = {
        uri: uri.trim(),
        ks: accountGuard,
        mintTo,
        collection_id: collectionId,
        name: (name || "").trim(),
        description: (description || "").trim(),
      };

      if (royalties > 0 && policy.includes("ROYALTY")) {
        envData.royaltyData = {
          royalty: royalties / 100,
          recipient: royaltyRecipient,
        };
      }

      // Define capabilities
      const capabilities = [
        { name: "coin.GAS", args: [] },
        {
          name: "marmalade-v2.ledger.CREATE-TOKEN",
          args: [tokenId, precision, uri.trim(), accountGuard],
        },
        { name: "marmalade-v2.ledger.MINT", args: [tokenId, mintTo, 1.0] },
        {
          name: "marmalade-v2.collection-policy-v1.TOKEN-COLLECTION",
          args: [collectionId, tokenId],
        },
      ];

      if (policy.includes("ROYALTY")) {
        capabilities.push({
          name: "marmalade-v2.royalty-policy-v1.ENFORCE-ROYALTY",
          args: [tokenId],
        });
      }

      // Transaction metadata
      const txMeta = createTxMeta(chainId, account);

      // Create transaction
      const pactCommand = {
        networkId: KADENA_NETWORK_ID,
        payload: {
          exec: {
            data: envData,
            code: pactCode,
          },
        },
        signers: [
          {
            pubKey: accountGuard.keys[0],
            scheme: "ED25519",
            clist: capabilities,
          },
        ],
        meta: txMeta,
        nonce: `mint:${Date.now()}:${Math.random()
          .toString(36)
          .substring(2, 15)}`,
      };

      // Generate transaction hash
      req.logStep("Generating transaction hash");
      const cmdString = JSON.stringify(pactCommand);
      const transactionHash = generateTransactionHash(cmdString);

      req.logStep("NFT launch transaction prepared");
      return res.json({
        transaction: {
          cmd: cmdString,
          hash: transactionHash,
          sigs: [null],
        },
        tokenId: tokenId,
        metadata: {
          name: name || "",
          description: description || "",
          uri: uri,
          collection: collectionId,
          royalties: royalties > 0 ? `${royalties}%` : "0%",
        },
      });
    } catch (error) {
      req.logStep("Transaction preparation failed");
      return res.status(500).json({
        error: "Transaction preparation failed",
        details: error.message,
      });
    }
  } catch (error) {
    req.logStep("Unhandled error");
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * POST /nft/collection
 * Generates an unsigned transaction to create a new Marmalade collection.
 *
 * Required body parameters:
 * - account: The account address (must start with "k:")
 * - name: Collection name (non-empty string)
 *
 * Optional body parameters:
 * - description: Collection description (string, default: "")
 * - totalSupply: Maximum supply for the collection (positive integer, default: 1000000)
 * - chainId: Blockchain chain ID (string, default: "2")
 */
router.post("/collection", async (req, res) => {
  try {
    req.logStep("Start collection creation request");

    const {
      account,
      name,
      description = "",
      totalSupply = 1000000,
      chainId = "2",
    } = req.body;

    // Validate required parameters
    const chainIdValidation = validateChainId(chainId);
    if (!chainIdValidation.valid) {
      req.logStep("Invalid chain ID");
      return res.status(400).json({
        error: chainIdValidation.error,
        details: chainIdValidation.details,
      });
    }

    // Validate account
    const accountValidation = validateAccount(account);
    if (!accountValidation.valid) {
      req.logStep("Invalid account format");
      return res.status(400).json({
        error: accountValidation.error,
        details: accountValidation.details,
      });
    }

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      req.logStep("Missing or invalid collection name");
      return res.status(400).json({
        error: "Missing required parameters",
        details: "name is required and must be a non-empty string",
      });
    }

    // Validate totalSupply
    const parsedTotalSupply = parseInt(totalSupply);
    if (isNaN(parsedTotalSupply) || parsedTotalSupply <= 0) {
      req.logStep("Invalid total supply");
      return res.status(400).json({
        error: "Invalid totalSupply",
        details: "totalSupply must be a positive integer",
      });
    }

    // Validate description if provided
    if (description && typeof description !== "string") {
      req.logStep("Invalid description format");
      return res.status(400).json({
        error: "Invalid description",
        details: "description must be a string",
      });
    }

    // Extract account guard from k: address
    let accountGuard;
    if (account.startsWith("k:") && account.length === 66) {
      const publicKey = account.substring(2); // Remove "k:" prefix
      accountGuard = {
        keys: [publicKey],
        pred: "keys-all",
      };
      req.logStep("Extracted account guard from k: address");
    } else {
      req.logStep("Invalid account format for collection creation");
      return res.status(400).json({
        error: "Invalid account format",
        details: "Only k: addresses are supported for collection creation",
      });
    }

    try {
      const pactClient = getClient(chainId);

      // Generate collection ID using the same approach as Kadena examples
      req.logStep("Generating collection ID");
      const collectionIdCmd = Pact.builder
        .execution(
          `(use marmalade-v2.collection-policy-v1)
           (create-collection-id ${JSON.stringify(
             name.trim()
           )} (read-keyset 'ks))`
        )
        .setMeta({
          chainId: ensureChainIdString(chainId),
          gasLimit: 80000,
          gasPrice: 0.0000001,
        })
        .addKeyset("ks", accountGuard.pred, ...accountGuard.keys)
        .setNetworkId(KADENA_NETWORK_ID)
        .createTransaction();

      const collectionIdResult = await pactClient.dirtyRead(collectionIdCmd);

      if (!collectionIdResult?.result?.data) {
        req.logStep("Failed to generate collection ID");
        const errorMessage =
          collectionIdResult?.result?.error?.message ||
          "Failed to generate collection ID";
        throw new Error(errorMessage);
      }

      const collectionId = collectionIdResult.result.data;
      req.logStep(`Generated collection ID: ${collectionId}`);

      // Build transaction using Kadena examples approach
      req.logStep("Building collection transaction");
      const pactCode = `(use marmalade-v2.collection-policy-v1)
(create-collection ${JSON.stringify(collectionId)}
                   ${JSON.stringify(name.trim())}
                   ${parsedTotalSupply}
                   (read-keyset 'ks)) ${JSON.stringify(collectionId)}`;

      // Prepare environment data
      const envData = {
        ks: accountGuard,
      };

      // Transaction metadata
      const txMeta = createTxMeta(chainId, account);

      // Create transaction following Kadena examples approach (no capabilities)
      const pactCommand = {
        networkId: KADENA_NETWORK_ID,
        payload: {
          exec: {
            data: envData,
            code: pactCode,
          },
        },
        signers: [
          {
            pubKey: accountGuard.keys[0],
            scheme: "ED25519",
          },
        ],
        meta: txMeta,
        nonce: `collection:${Date.now()}:${Math.random()
          .toString(36)
          .substring(2, 15)}`,
      };

      // Generate transaction hash
      req.logStep("Generating transaction hash");
      const cmdString = JSON.stringify(pactCommand);
      const transactionHash = generateTransactionHash(cmdString);

      req.logStep("Collection transaction prepared");
      return res.json({
        transaction: {
          cmd: cmdString,
          hash: transactionHash,
          sigs: [null],
        },
        collectionId: collectionId,
        metadata: {
          name: name.trim(),
          description: description.trim(),
          totalSupply: parsedTotalSupply,
        },
      });
    } catch (error) {
      req.logStep("Transaction preparation failed");

      // Provide more specific error messages
      if (error.message.includes("already exists")) {
        return res.status(409).json({
          error: "Collection already exists",
          details: error.message,
        });
      }

      if (error.message.includes("Account not found")) {
        return res.status(404).json({
          error: "Account not found",
          details: "The specified account does not exist on the blockchain",
        });
      }

      return res.status(500).json({
        error: "Transaction preparation failed",
        details: error.message,
      });
    }
  } catch (error) {
    req.logStep("Unhandled error");
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.use((err, req, res, next) => {
  console.error("Unhandled error in NFT routes:", err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

module.exports = router;
