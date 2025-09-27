import { ChainId, Pact, createClient } from "@kadena/client";
import { networkId } from "../services/magic";
import { tokens } from "./tokens";

interface GetBalanceTransaction {
  chainId: ChainId;
  accountName: string;
}

interface TokenInfo {
  symbol: string;
  precision: number;
}

interface DecimalBalance {
  decimal: string;
}

interface TokenBalance {
  symbol: string;
  balance: number;
}

const getKadenaClient = (chainId: ChainId) => {
  return createClient(
    `https://api.chainweb.com/chainweb/0.0/${networkId}/chain/${chainId}/pact`
  );
};

const getTokens = (): { [key: string]: TokenInfo } => {
  return Object.entries(tokens).reduce(
    (
      acc: { [key: string]: TokenInfo },
      [tokenName, tokenInfo]: [string, any]
    ) => {
      acc[tokenName] = {
        symbol: tokenInfo.symbol,
        precision: tokenInfo.precision,
      };
      return acc;
    },
    {}
  );
};

export const buildGetBalanceTransaction = ({
  chainId,
  accountName,
  tokenName = "coin",
}: GetBalanceTransaction & { tokenName?: string }) => {
  const moduleAndFunction =
    tokenName === "coin"
      ? `(coin.get-balance "${accountName}")`
      : `(${tokenName}.get-balance "${accountName}")`;

  return Pact.builder
    .execution(moduleAndFunction)
    .setMeta({ chainId })
    .setNetworkId(networkId)
    .createTransaction();
};

export const getBalance = async (
  accountName: string,
  chainId: ChainId,
  tokenName: string = "coin",
  retries: number = 2
) => {
  const kadenaClient = getKadenaClient(chainId);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const transaction = buildGetBalanceTransaction({
        chainId,
        accountName,
        tokenName,
      });
      
      const response = await kadenaClient.dirtyRead(transaction);
      if (response.result.status === "success") {
        console.log(`Balance of ${tokenName}:`, response.result.data);
        return (response.result as any).data as number | DecimalBalance;
      }
      return 0;
    } catch (error) {
      console.error(`Failed to get ${tokenName} balance (attempt ${attempt + 1}):`, error);
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  return 0;
};

export const getAllBalances = async (
  accountName: string,
  chainId: ChainId
): Promise<TokenBalance[]> => {
  const tokenEntries = Object.entries(tokens);
  const balances: TokenBalance[] = [];
  
  // Process tokens in batches to avoid overwhelming the network
  const batchSize = 5;
  for (let i = 0; i < tokenEntries.length; i += batchSize) {
    const batch = tokenEntries.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ([tokenName, tokenInfo]) => {
      try {
        const balance = await getBalance(accountName, chainId, tokenName);
        return {
          symbol: tokenInfo.symbol,
          balance:
            typeof balance === "object" && (balance as DecimalBalance)?.decimal
              ? parseFloat((balance as DecimalBalance).decimal)
              : (balance as number),
        };
      } catch (error) {
        console.error(`Failed to get ${tokenName} balance:`, error);
        return null; // Return null for failed requests
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    balances.push(...batchResults.filter((result): result is TokenBalance => result !== null));
    
    // Add a small delay between batches to be gentle on the network
    if (i + batchSize < tokenEntries.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(balances);
  // Filter out zero balances
  return balances.filter(({ balance }) => balance > 0);
};
