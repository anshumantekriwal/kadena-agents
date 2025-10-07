import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
API_KEY = os.getenv("API_KEY")

# OpenAI Model Configuration
MODEL_NAME = "o4-mini"
GPT4_MODEL = "gpt-5"


# API documentation
API_DOCS = {

    # Token transfer
    "transfer": {
        "description": "Transfer tokens from one account to another",
        "required_params": [
            "tokenAddress",  # Token contract address
            "sender",        # Sender account
            "receiver",      # Receiver account
            "amount",        # Amount to transfer
            "chainId"        # Chain ID (0-19)
        ],
        "optional_params": [
            {"name": "meta", "description": "Additional metadata"},
            {"name": "gasLimit", "description": "Gas limit for transaction"},
            {"name": "gasPrice", "description": "Gas price for transaction"},
            {"name": "ttl", "description": "Transaction time-to-live"}
        ],
        "endpoint": "/transfer"
    },
    
    # Token swapping
    "swap": {
        "description": "Swap one token for another using Kaddex/EchoDEX",
        "required_params": [
            "tokenInAddress",  # Address of input token
            "tokenOutAddress", # Address of output token
            "account",         # Sender account
            "chainId"          # Chain ID (0-19)
        ],
        "conditional_params": [
            {"name": "amountIn", "description": "Amount to swap", "condition": "Either amountIn or amountOut must be provided"},
            {"name": "amountOut", "description": "Desired output amount", "condition": "Either amountIn or amountOut must be provided"}
        ],
        "optional_params": [
            {"name": "slippage", "description": "Maximum acceptable slippage"}
        ],
        "endpoint": "/swap"
    },
    
    # Token quote
    "quote": {
        "description": "Get price quotes for swapping tokens",
        "required_params": [
            "tokenInAddress",  # Address of input token
            "tokenOutAddress", # Address of output token
            "chainId"          # Chain ID (0-19)
        ],
        "conditional_params": [
            {"name": "amountIn", "description": "Input amount to get output quote", "condition": "Either amountIn or amountOut must be provided"},
            {"name": "amountOut", "description": "Desired output amount to get input quote", "condition": "Either amountIn or amountOut must be provided"}
        ],
        "response": {
            "amountIn": "Required input amount (when amountOut is provided)",
            "amountOut": "Expected output amount (when amountIn is provided)",
            "priceImpact": "Price impact percentage as a string"
        },
        "endpoint": "/quote"
    },
    
    # NFT launch
    "nft_launch": {
        "description": "Launch a new NFT on the Kadena blockchain. The collectionId should be in the format of collection:id (e.g. collection:1234567890)",
        "required_params": [
            "account",         # Sender account
            "guard",           # Account guard
            "mintTo",          # Recipient account
            "uri",             # NFT metadata URI
            "collectionId",     # Collection ID
            "chainId"          # Chain ID (0-19)
        ],
        "optional_params": [
            {"name": "precision", "description": "Token precision"},
            {"name": "policy", "description": "NFT policy"},
            {"name": "royalties", "description": "Royalty percentage"},
            {"name": "royaltyRecipient", "description": "Royalty recipient"},
            {"name": "name", "description": "NFT name"},
            {"name": "description", "description": "NFT description"}
        ],
        "endpoint": "/nft/launch"
    },
    
    # NFT collection
    "nft_collection": {
        "description": "Create a new NFT collection",
        "required_params": [
            "account",         # Sender account
            "name",            # Collection name
            "chainId"          # Chain ID (0-19)
        ],
        "optional_params": [
            {"name": "description", "description": "Collection description"},
            {"name": "totalSupply", "description": "Maximum supply"}
        ],
        "endpoint": "/nft/collection"
    }
}

TOKENS = """
mainnet:
  coin:
    symbol: KDA
    name: KDA
    description: Native token of Kadena
    img: img/kda.svg
    color: "#4a9079"
    totalSupply: 1000000000
    precision: 12
    socials:
      - type: website
        url: https://www.kadena.io/
      - type: twitter
        url: https://twitter.com/kadena_io
      - type: discord
        url: https://discord.com/invite/kadena
      - type: github
        url: https://github.com/kadena-io

  arkade.token:
    symbol: ARKD
    name: Arkade
    description:
    img: img/ark.png
    color: "#cc66ff"
    precision: 12
    socials:
      - type: website
        url: https://www.arkade.fun/
      - type: twitter
        url: https://twitter.com/ArkadeFun

  free.maga:
    symbol: MAGA
    name: MAGA
    description:
    img: img/maga.png
    color: "#9d0b32"
    precision: 12
    socials:
      - type: twitter
        url: https://x.com/MAGA_KDA

  free.crankk01:
    symbol: CRKK
    name: CRKK
    description:
    img: img/crankk.png
    color: "#7f6afc"
    precision: 12
    socials:
      - type: website
        url: https://crankk.io/


  free.cyberfly_token:
    symbol: CFLY
    name: CFLY
    description:
    img: img/cfly.svg
    color: "#1f1fc2"
    precision: 8
    socials: []

  free.finux:
    symbol: FINX
    name: FINUX
    description:
    img: img/finux.png
    color: "#23a45c"
    precision: 12
    socials: []

  free.kishu-ken:
    symbol: KISHK
    name: KISHK
    description: First Kadena memecoin 
    img: img/kishk.png
    color: "#cbcbcc"
    totalSupply: 1000000000000000.00
    circulatingSupply: 689488206446005.00
    precision: 12
    socials:
      - type: website
        url: https://kishuken.me/
      - type: twitter
        url: https://x.com/kishu_ken_kda
      - type: telegram
        url: https://t.me/kishukens
      
  kaddex.kdx:
    symbol: KDX
    name: KDX
    description: Kaddex / Ecko Token
    img: img/kdx.svg
    color: "#ff5271"
    totalSupply: 900699352.80
    circulatingSupply: 244,760,172.96
    precision: 12
    socials:
      - type: website
        url: https://ecko.finance/
      - type: github
        url: https://github.com/eckoDAO-org
      - type: twitter
        url: https://x.com/eckoDAO
      - type: discord
        url: https://discord.gg/eckodao

  n_625e9938ae84bdb7d190f14fc283c7a6dfc15d58.ktoshi:
    symbol: KTO
    name: KTO
    description: Katoshi
    img: img/ktoshi.png
    color: "#34daa8"
    precision: 15
    socials:
      - type: website
        url: https://ktoshi.com/
      - type: twitter
        url: https://x.com/ktoshis

  n_b742b4e9c600892af545afb408326e82a6c0c6ed.zUSD:
    symbol: zUSD
    name: zUSD
    description: Stable coin issued by Zelcore
    img: img/zUSD.svg
    color: "#8a62eb"
    precision: 18
    socials:
      - type: website
        url: https://zelcore.io/

  n_e309f0fa7cf3a13f93a8da5325cdad32790d2070.heron:
    symbol: HERON
    name: HERON
    description:
    img: img/heron.png
    totalSupply: 963142522
    circulatingSupply: 693142522
    color: "#a22726"
    precision: 12
    socials:
      - type: website
        url: https://www.heronheroes.com
      - type: twitter
        url: https://x.com/HeronHeroesKDA

  n_582fed11af00dc626812cd7890bb88e72067f28c.bro:
    symbol: BRO
    name: BRO
    description: Token of the Brother's Telegram group
    img: img/bro.png
    color: "#af826a"
    totalSupply: 100
    circulatingSupply: 80
    precision: 12
    socials:
        - type: website
          url: https://bro.pink/
        - type: twitter
          url: https://x.com/thebrothersdao

  runonflux.flux:
    symbol: FLUX
    name: FLUX
    description: Native token of the Flux blockchain
    img: img/flux-crypto.svg
    color: "#2b61d1"
    totalSupply: 440000000
    precision: 8
    socials:
      - type: website
        url: https://runonflux.io/
      - type: twitter
        url: https://t.me/zelhub
      - type: discord
        url: https://discord.gg/keVn3HDKZw

  free.wiza:
      symbol: WIZA
      name: WIZA
      description: Wizards Arena
      img: img/wizards.png
      color: "#ed0404"
      precision: 12
      socials:
        - type: website
          url: https://www.wizardsarena.net

  hypercent.prod-hype-coin:
    symbol: HYPE
    name: HYPE
    description: Hypercent token
    img: img/hypercent-crypto.svg
    color: "#c40a8d"
    totalSupply: 10000000
    precision: 12
    socials:
      - type: website
        url: https://hypercent.io/
      - type: twitter
        url: https://twitter.com/hypercentpad
      - type: discord
        url: https://discord.gg/dxVvdNhqaE
      - type: telegram
        url: http://t.me/HyperCent

  free.babena:
    symbol: BABE
    name: BABE
    description: Babena - First DEFI project on Kadena
    img: img/babena-logo.svg
    color: "#ffcc4d"
    totalSupply: 12967695
    precision: 12
    socials:
      - type: website
        url: https://babena.finance

  kdlaunch.token:
    symbol: KDL
    name: KDL
    description: KDLaunch
    img: img/kdl.svg
    color: "#4aa5b1"
    totalSupply: 100000000
    precision: 12
    socials:
      - type: website
        url: https://www.kdlaunch.com/
      - type: twitter
        url: https://twitter.com/KdLaunch
      - type: telegram
        url: https://t.me/KDLaunchOfficial
      - type: discord
        url: https://discord.com/invite/GghUdhmk6z

  kdlaunch.kdswap-token:
    symbol: KDS
    name: KDS
    description: KDSwap
    img: img/kds.svg
    color: "#6ebbf2"
    totalSupply: 100000000
    precision: 12
    socials:
      - type: website
        url: https://www.kdswap.exchange/
      - type: twitter
        url: https://twitter.com/KDSwap
      - type: telegram
        url: https://t.me/KDSwapOfficial
      - type: discord
        url: https://discord.com/invite/GghUdhmk6z

  n_2669414de420c0d40bbc3caa615e989eaba83d6f.highlander:
    symbol: HLR
    name: HLR
    description:
    img: img/uno.webp
    totalSupply: 1
    circulatingSupply: 1
    color: "#3d3939"
    precision: 12
    socials:
      - type: website
        url: https://youtu.be/dQw4w9WgXcQ?si=h0SS4HbaWxLgw2IA
  
  n_c89f6bb915bf2eddf7683fdea9e40691c840f2b6.cwc:
    symbol: CWC
    name: CWC
    description:
    img: img/cwc.webp
    totalSupply: 4000000
    circulatingSupply: 520
    color: "#a22726"
    precision: 12
    socials:
      - type: website
        url: guardiansofkadena.com
      - type: twitter
        url: https://x.com/GuardiansofKDA

  n_95d7fe012aa7e05c187b3fc8c605ff3b1a2c521d.MesutÖzilDönerKebabMerkel42Inu:
    symbol: KEBAB
    name: KEBAB
    description: This Token is a symbol of love to Döner Kebab and to the friendship between Germany and Turkey
    img: img/kebab.webp
    totalSupply: 100000000
    circulatingSupply: 100000000
    color: "#a22726"
    precision: 12
    socials: []
             
  n_95d7fe012aa7e05c187b3fc8c605ff3b1a2c521d.ShrekYodaTrumpMarsX12Inu:
    symbol: GREENCOIN
    name: GREENCOIN
    description: Cult for green coin, Trump and mars lovers.
    img: img/greencoin.webp
    totalSupply: 100000000
    circulatingSupply: 100000000
    color: "#a22726"
    precision: 12
    socials: []

  n_95d7fe012aa7e05c187b3fc8c605ff3b1a2c521d.SonGokuBezosPikachu12Inu:
    symbol: WLONG
    name: WLONG
    description: May the power of Wenlong be with us.
    img: img/wlong.webp
    totalSupply: 100000000
    circulatingSupply: 100000000
    color: "#a22726"
    precision: 12
    socials: []

  n_d8d407d0445ed92ba102c2ce678591d69e464006.TRILLIONCARBON:
    symbol: TCTC
    name: TCTC
    description: the official corporate token and ledger of Trillion Capital Toronto Corporation used for internal purposes
    img: img/tril.png
    totalSupply: 1000001
    circulatingSupply: 1000001
    color: "#a22726"
    precision: 12
    socials: 
      - type: website
        url: https://trillioncapital.ca
      - type: twitter
        url: https://twitter.com/TRILLIONCAP

  n_518dfea5f0d2abe95cbcd8956eb97f3238e274a9.AZUKI:
    symbol: AZUKI
    name: AZUKI
    description: Will Martino's beloved companion, AZUKI is a community managed token. Woof!.
    img: img/azuki.png
    totalSupply: 100000000
    circulatingSupply: 100000000
    color: "#218dc5"
    precision: 12
    socials:
      - type: website
        url: https://www.azukionkadena.fun
      - type: twitter
        url: https://x.com/AzukiKDA
      - type: telegram
        url: https://t.me/AzukiKDA

  n_71c27e6720665fb572433c8e52eb89833b47b49b.Peppapig:
    symbol: PP
    name: PP
    description:
    img: img/peppa.png
    totalSupply: 1000000000
    circulatingSupply: 1000000000
    color: "#a22726"
    precision: 12
    socials: 
      - type: telegram
        url: https://t.me/peppapigmemetokenkda

testnet:
  coin:
    symbol: KDA
    name: KDA
    description: Native token of Kadena
    img: img/kda.svg
    totalSupply: 1000000000
    socials:
      - type: website
        url: https://www.kadena.io/
      - type: twitter
        url: https://twitter.com/kadena_io
      - type: discord
        url: https://discord.com/invite/kadena
      - type: github
        url: https://github.com/kadena-io

blacklist:
  - lago.USD2
  - lago.kwBTC
  - lago.kwUSDC
  - free.elon
  - mok.token
  - free.docu
  - free.kpepe
  - free.backalley
  - free.kapybara-token
  - free.jodie-token
  - free.corona-token
  - free.KAYC
  - free.anedak
  - n_95d7fe012aa7e05c187b3fc8c605ff3b1a2c521d.MesutÖzilDönerKebabMerkel42Inu
"""

# API Endpoints
KADENA_API_BASE_URL = "https://kadena-agents.onrender.com"
ANALYSIS_API_URL = "https://kadena-rag.onrender.com/query"

# History Configuration
MAX_HISTORY_LENGTH = 10  # Maximum number of conversation pairs to keep

# Ecosystem Projects Data
ECOSYSTEM_PROJECTS = """
## Kadena Ecosystem Projects

### Official Resources
- **GitHub Repositories**: 
  - Primary: https://github.com/kadena-io
  - Community: https://github.com/kadena-community
- **Website**: https://kadena.io
- **Documentation**: https://docs.kadena.io
- **Explorer**: https://explorer.chainweb.com, https://kdaexplorer.com

### DEXes
- **KDSwap**: Gas-free DEX pursuing MiCA compliance. Zero gas fees via Gas Stations. https://www.kdswap.exchange/
- **Mercatus**: Zero-fee, community-driven decentralized DEX. Built for censorship resistance. https://www.mercatus.works/
- **Bro-DEX**: Order-book based DEX with zero maker fees. Real-time orderbook on mainnet Chain 2. https://dex.bro.pink/

### Wallets
- **eckoWALLET**: Leading Kadena-native wallet with web extension and mobile apps. Token & NFT management, built-in swaps. https://eckowallet.com
- **Koala Wallet**: Non-custodial wallet with best-in-class NFT support and cross-chain transactions. https://koalawallet.io/
- **LinxWallet**: Gas-free mobile wallet for Kadena and Alephium with chainless transfers. https://linxlabs.org/wallet
- **Magic**: Keyless wallet abstraction via email OTP and social login. Simplifies Web3 onboarding. https://magic.link/
- **Zelcore**: Multi-chain wallet supporting 450+ coins across 80+ blockchains. https://zelcore.io/
- **Enkrypt**: Multi-chain browser extension (MetaMask alternative) supporting 70+ networks. https://www.enkrypt.com/

### NFT & Gaming
- **Marmalade**: Official Kadena NFT standard (KIP-0013 v2) with policy-based features and royalties
- **Wizards Arena**: Play-to-Earn digital collectible battler with WIZA token rewards and weekly tournaments. https://www.wizardsarena.net/
- **KadCars-NFT**: Web3 racing game with upgradable 3D NFT cars built in Unity. https://kadena.io/ecosystem/kadcars-nft

### DeFi & Infrastructure
- **Hypercent**: Launchpad and IDO platform with fair lottery system and project incubation. https://app.hypercent.io/
- **Swarms.finance**: DAO creation and management tool with on-chain voting and gas-free UX. https://dao.swarms.finance/
- **Chips**: Tokenized crypto mining with hashrate rentals and multi-algorithm support (BTC, KDA, KAS, LTC). https://www.chips.finance/
- **DIA**: Trustless oracle network providing transparent price feeds and data for DeFi. https://www.diadata.org/

### Real-World Use Cases
- **DNA**: Anti-counterfeiting platform using NFTs for product provenance and authenticity. https://kadena.io/ecosystem/dna
- **Crankk**: DePIN LoRaWAN IoT network with Proof-of-Network-Participation rewards. https://www.crankk.io/
- **Cyberfly.io**: Decentralized IoT platform for Raspberry Pi and ESP32 with real-time data. https://cyberfly.io/
- **UNITT**: Privacy-preserving messaging platform with tokenized interactions. https://www.unitt.io/

### Developer Tools
- **Eucalyptus Labs**: Builders of Koala Wallet, Kadena Explorer, and developer SDKs. https://www.eucalyptuslabs.com/
- **Hack-a-Chain**: GraphQL indexer and custom dApp development for Kadena. https://www.hackachain.io/

### Key Standards
- **KIP-0007**: Poly-fungible token standard (similar to ERC-1155)
- **KIP-0013**: Marmalade v2 NFT standard with policy framework
""" 