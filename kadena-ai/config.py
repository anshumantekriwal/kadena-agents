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
## Kadena Ecosystem Projects - Comprehensive Guide

### Official Resources
**GitHub Repositories**
- Overview: Official Kadena GitHub organizations
- Primary: https://github.com/kadena-io
- Community: https://github.com/kadena-community
- Notes: Both are official organizations used by the Kadena team

**Kadena Explorer**
- Overview: Analytics and block explorer suite for Kadena offering network insights, transactions, and NFT collection data
- Key Features:
  • Block explorer for blocks, txs, accounts
  • Analytics: circulating supply, market cap, tx count, avg fees
  • Advanced search by address, request key, event, block height
  • Real-time blocks and transactions
  • NFT collections overview
- Current Metrics:
  • KDA Price: $0.448814 (-0.82%)
  • Circulating Supply: 327.45M KDA
  • Market Cap: $146.96M
  • Total Transactions: 199.76M
  • Avg TX Fee: $0.0000483
- Website: https://kdaexplorer.com/
- Official Explorer: https://explorer.chainweb.com/
- Ecosystem Page: https://www.kadena.io/ecosystem/kadena-explorer

---

### DEXes (Decentralized Exchanges)

**KDSwap**
- Overview: Gas-free DEX on Kadena with a clean UX and a compliance roadmap toward MiCA in Europe
- Key Features:
  • Gas-free token swaps via Gas Stations (gas covered by protocol)
  • Decentralized exchange on Kadena
  • Simple, innovative user experience
  • Pursuing MiCA (EU) compliance
  • Liquidity pools and yield farming opportunities
  • Standard AMM trading fees may apply
  • Core team + DAO governance (planned)
- Token: KDS (used for governance/staking/incentives)
- Compliance: Pursuing MiCA compliance roadmap
- Website: https://www.kdswap.exchange/
- Ecosystem Page: https://www.kadena.io/ecosystem/kdswap
- X (Twitter): https://x.com/KdSwap
- Telegram: https://t.me/kdswap
- GitHub: https://github.com/kdswap
- Kadena Perspectives: https://www.kadena.io/perspectives/kdswap-working-towards-becoming-mica-compliant-dex

**Mercatus**
- Overview: Community-built, truly decentralized, zero-fee DEX on Kadena for seamless token swaps and liquidity
- Key Features:
  • Zero trading fees (no swap or gas fees)
  • Community-driven development and governance
  • Fully decentralized and censorship-resistant
  • AMM with on-chain order books
  • Liquidity provision and analytics
  • Community DAO governs protocol parameters
- Token: KDX (governance/staking utility listed on DeFiLlama)
- Architecture: Automated Market Maker (AMM) with on-chain order matching
- Website: https://www.mercatus.works/
- Docs: https://docs.mercatus.works/
- Ecosystem Page: https://www.kadena.io/ecosystem/mercatus
- X Announcement: https://x.com/kadena_io/status/1834668620485738947
- DeFiLlama: https://defillama.com/protocol/mercatus

**Bro-DEX**
- Overview: Fully decentralized order-book DEX on Kadena with zero maker fees and real-time order matching
- Key Features:
  • Order-book model (not AMM)
  • Zero maker fees
  • Multiple trading pairs (BRO/KDA, BRO/zUSD, BRO/HERON, KDA/zUSD)
  • Live on mainnet (Chain 2)
  • Real-time orderbook transparency
  • Smart contracts in Pact on Kadena
- Token: BRO (Kadena Brothers DAO)
- Tokenomics: DEX fees flow to Public Treasury; KDA swapped to BRO (self-pumping mechanism). Rewards active cultural contributions
- Website: https://dex.bro.pink/
- Ecosystem Page: https://www.kadena.io/ecosystem/bro-dex
- X Announcement: https://x.com/kadena_io/status/1904600157515358315
- Medium: https://medium.com/@crypto-pac/bro-dex-orderbook-based-dex-on-kadena-and-pact-part-2-2-scalability-decoding-25479babba4f
- GitHub: https://github.com/brothers-DAO/bro-token

---

### Wallets

**eckoWALLET**
- Overview: Leading Kadena-native wallet (web extension + mobile) with DeFi features, swaps, NFTs, and cross-chain support
- Key Features:
  • Optimized for Kadena (web extension + iOS/Android)
  • Non-custodial asset control
  • Token and NFT management
  • Built-in swaps and WalletConnect support
  • Clean UX and cross-chain transfers
- Value Proposition: A comprehensive gateway to Kadena DeFi and NFTs across desktop and mobile
- Chrome Web Store: https://chromewebstore.google.com/detail/eckowallet/bofddndhbegljegmpmnlbhcejofmjgbn
- Ecosystem Page: https://www.kadena.io/ecosystem/eckowallet
- X (Twitter): https://x.com/eckowallet
- Play Store: https://play.google.com/store/apps/details?id=com.xwallet.mobile
- App Store: https://apps.apple.com/us/app/eckowallet/id1632056372

**Koala Wallet**
- Overview: Non-custodial wallet with fast UX, strong security, NFT support, and cross-chain features tailored for Kadena
- Key Features:
  • User-controlled keys; non-custodial
  • Multi-blockchain support with Kadena focus
  • Buy, send, receive, and store crypto
  • Mobile dApp compatibility
  • Best-in-class NFT support on Kadena
  • Cross-chain transactions on Chainweb
  • KadenaKeys tool for exporting private keys
- Value Proposition: Streamlines secure asset and NFT management for Kadena users with a polished, mobile-first experience
- Website: https://koalawallet.io/
- Ecosystem Page: https://www.kadena.io/ecosystem/koala-wallet
- App Store: https://apps.apple.com/us/app/koala-wallet/id1627486259
- Play Store: https://play.google.com/store/apps/details?id=com.eucalyptuslabs.kowallet
- X (Twitter): https://x.com/koalawallet
- Medium: https://medium.com/@KoalaWallet
- Support: https://support.koalawallet.io/

**LinxWallet**
- Overview: Non-custodial, gas-free mobile wallet for Kadena and Alephium focused on simple DeFi and asset transfers
- Key Features:
  • True gas-free transfers and chainless transfers
  • Non-custodial; user controls keys
  • Multi-chain: Kadena and Alephium
  • Mobile apps on iOS and Android
  • Easy asset management and swaps
  • Automatic token discovery (no manual add)
- Value Proposition: Removes fee friction and complexity to make everyday crypto actions accessible on Kadena/Alephium
- Team: Built by Linx Labs (formerly ThinEdge Labs)
- Website: https://linxlabs.org/wallet
- Ecosystem Page: https://www.kadena.io/ecosystem/linxwallet
- X (Twitter): https://x.com/LinxWallet
- Play Store: https://play.google.com/store/apps/details?id=com.thinedgelabs.linx_wallet
- App Store: https://apps.apple.com/id/app/linx-wallet/id6450412379
- Kadena Perspectives: https://www.kadena.io/perspectives/spotlight-on-linx-by-thinedge-labs

**Magic**
- Overview: Magic (Magic Labs) provides keyless, passwordless wallets and wallet abstraction via a developer SDK to streamline Web3 onboarding
- Key Features:
  • Wallet abstraction for simplified UX
  • Keyless/passwordless auth (email OTP, magic links, social, WebAuthn)
  • Developer-friendly JS SDK
  • Multi-chain support including Kadena
  • Security and compliance focus
  • Familiar Web2 login flows for onboarding
- Value Proposition: Removes the Web3 wallet complexity barrier, enabling mainstream-friendly onboarding for apps building on Kadena
- Website: https://magic.link/
- Ecosystem Page: https://www.kadena.io/ecosystem/magic
- Docs: https://magic.link/docs/blockchains/other-chains/other/kadena
- X (Twitter): https://x.com/magic_labs
- X Announcement: https://x.com/kadena_io/status/1874849096823103736

**Zelcore**
- Overview: Secure non-custodial multi-chain wallet for 450+ coins and 50k+ tokens across 80+ blockchains, including Kadena
- Key Features:
  • User-controlled keys and privacy safeguards
  • Store, send, receive, swap, buy, sell crypto and NFTs
  • Decentralized 2FA
  • Built-in exchange integrations
  • Desktop and mobile apps (Win/macOS/Linux/iOS/Android)
- Value Proposition: Versatile portfolio-level control for power users spanning many chains with strong security and privacy
- Website: https://zelcore.io/
- Ecosystem Page: https://www.kadena.io/ecosystem/zelcore
- Play Store: https://play.google.com/store/apps/details?id=com.zelcash.zelcore
- App Store: https://apps.apple.com/us/app/zelcore/id1436296839
- X (Twitter): https://x.com/zelcore_io

**Enkrypt**
- Overview: Multichain browser-extension wallet (MetaMask alternative) supporting 70+ networks including Kadena, with tokens, NFTs, and dApp access
- Key Features:
  • 70+ blockchain networks supported
  • Non-custodial key management
  • Hold, buy, send, receive, swap
  • NFT management and Web3 dApp access
  • Open-source codebase
  • Roadmap to buy/sell/stake/swap KDA in-wallet
- Value Proposition: Unifies multi-chain asset and dApp workflows in a single extension, lowering friction for cross-ecosystem users
- Website: https://www.enkrypt.com/
- Ecosystem Page: https://www.kadena.io/ecosystem/enkrypt
- Chrome Web Store: https://chromewebstore.google.com/detail/enkrypt-eth-btc-and-solan/kkpllkodjeloidieedojogacfhpaihoh
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/enkrypt/
- Opera: https://addons.opera.com/en/extensions/details/enkrypt/
- X (Twitter): https://x.com/enkrypt_com
- Kadena Tutorial: https://www.kadena.io/connect/6gBf7z_6rtk

---

### NFT & Gaming

**Marmalade (KIP-0013 v2)**
- Overview: Official Kadena NFT framework offering policy-based features (royalties, minting controls, metadata) for secure, flexible collections
- Key Features:
  • Flexible on-chain policy framework—define mint limits, whitelists & time locks in Pact
  • Improved royalty enforcement—set, track & distribute royalties automatically
  • Gas-Station integration—gas-free UX for end users
  • Built-in formal verification via Pact
  • Native support for upgradable NFT modules
- Standard: KIP-0013 v2 (Kadena Improvement Proposal)
- Docs: https://docs.kadena.io (see KIP-0013)
- Ecosystem Page: https://www.kadena.io/marmalade

**Wizards Arena**
- Overview: Play-to-Earn digital collectible battler on Kadena featuring NFT wizards, equipment, and turn-based combat with tournaments
- Key Features:
  • Play-to-Earn with $WIZA rewards
  • NFT characters and equipment ownership
  • Turn-based combat and weekly tournaments
  • Multiple modes including free-to-play Arena
  • Community-driven roadmap
  • Built on Kadena (Chainweb + Pact)
- Token: WIZA
- Earn Mechanics:
  • Staking NFT Wizards
  • Weekly airdrops to active players
  • Free-to-play rewards
  • Social engagement incentives
- Website: https://www.wizardsarena.net/
- Ecosystem Page: https://www.kadena.io/ecosystem/wizards-arena
- X (Twitter): https://x.com/WizardsArena
- Kadena Perspectives: https://www.kadena.io/perspectives/spotlight-on-wizards-arena

**KadCars-NFT**
- Overview: Web3 racing game on Kadena with upgradable, raceable, and rentable 3D NFT cars offering true digital ownership
- Key Features:
  • Hybrid arcade/physics-based racing built in Unity
  • Upgradable NFTs without burning via Ready-to-Render API (R2R)
  • Racing and customization sync to wallets and in-game
  • True ownership with trading and renting
  • Gas Station support for player transactions
  • Interoperability roadmap to use NFT cars in other 3D-enabled games
- Team:
  • Mohammed Khalaf (MK) - Co-Founder; Mechanical Engineer (BMW-funded car design and physics)
  • Mohannad Ahmed (Mo) - CTO & Software Engineer
  • Robertas - Team Lead with Web3/NFT project experience
- Ecosystem Page: https://www.kadena.io/ecosystem/kadcars-nft
- X (Twitter): https://x.com/kadcarsnft
- Discord: http://discord.gg/74znq8jM8a
- Enjin Showcase: https://enjin.io/ecosystem/kadcars
- Kadena Perspectives: https://www.kadena.io/perspectives/the-future-of-web3-racing-kadcars-on-kadena

**KadenAI**
- Overview: End-to-end NFT minting platform on Kadena using Pact, offering traits, royalties, APIs, and bot integrations
- Key Features:
  • Full NFT lifecycle: create, manage, trade
  • Trait support for unique NFTs
  • Royalties on secondary sales
  • NFT Minter Credits model
  • Developer APIs and bot integrations
  • Built on Kadena with Pact
- Tokenomics: Minting requires credits purchasable in the marketplace
- Ecosystem Page: https://www.kadena.io/ecosystem/kadenai
- Docs: https://kadenai-docs.readthedocs.io/en/latest/nfts/minter.html

---

### DeFi & Infrastructure

**Hypercent**
- Overview: Kadena launchpad/IDO platform and NFT marketplace focused on fair, transparent project launches and high-quality incubation
- Key Features:
  • Launchpad for utility tokens and NFTs on Kadena
  • Fair IDO model using on-chain lottery and queue (no rigid tiers)
  • Integrated wallet and mobile-friendly dashboard
  • Project verification and incubation
  • Multi-token economy with demand-reflective tickets/allocations
  • Gas-free UX leveraging Kadena Gas Stations
- Token: HYPE
- Tokenomics: Commissioned IDO tokens flow into an IDO Vault to incentivize HYPE holders and reduce ticket prices/allocation costs
- Team: Early Kadenians; founding team with community-driven focus
- Website: https://app.hypercent.io/
- Ecosystem Page: https://www.kadena.io/ecosystem/hypercent
- X (Twitter): https://x.com/hypercentpad
- Telegram: https://t.me/hypercentpad
- Discord: https://discord.gg/hypercent
- Kadena Perspectives: https://www.kadena.io/perspectives/spotlight-on-hypercent

**Swarms.finance**
- Overview: DAO creation and management tool on Kadena featuring on-chain voting, asset management, and a beginner-friendly UI
- Key Features:
  • Create and manage DAOs in minutes
  • On-chain voting executing blockchain transactions
  • Treasury and asset management (funds, LP, swaps, payments, purchases)
  • Gas-free UX via Kadena Gas Stations
  • Transparency through fully on-chain operations
  • Academy resources for first-time users
- Tokenomics: No explicit native token; platform focuses on enabling DAOs and their assets
- Website: https://dao.swarms.finance/
- Ecosystem Page: https://www.kadena.io/ecosystem/swarms-finance
- X (Twitter): https://x.com/SwarmsFinance
- GitBook: https://swarms-finance.gitbook.io/swarms.finance-app
- Kadena Perspectives: https://www.kadena.io/perspectives/project-spotlight-swarms-finance

**Chips**
- Overview: Chips democratizes crypto mining via tokenized, multi-algorithm hashrate rentals with cheap electricity. Users can own ASIC exposure through tokens, rent hashrate, and access real-time analytics with transparency
- Key Features:
  • Tokenized ASICs for fractional ownership and liquidity
  • Hashrate rentals without owning physical hardware
  • Multi-algorithm mining (Bitcoin, Kaspa, Litecoin, Kadena)
  • User-friendly interface; no advanced skills required
  • Decentralization, security, and transparency
  • Real-time mining data and tools
- Current Metrics:
  • APR: 47.44%
  • TVL: $107,194 USD
  • Active Miners: 72
  • Total KDA Mined: 70,842
  • Total BTC Mined: 0.32179
  • Mining Contracts Started: 149
  • Total Reward Claims: 226
- Team:
  • James Folkard - Co-Founder & CEO
  • Todd Leach - Co-Founder & CTO
  • Daniel Jones - Co-Founder & COO
  • Toni Shopova - CRO
  • Sophia Shota - PMO & CBDO
  • Dennis Nita - Mining Ops & Community Lead
  • Uy Pham - Graphic Designer
- Website: https://www.chips.finance/
- Ecosystem Page: https://www.kadena.io/ecosystem/chips
- X (Twitter): https://x.com/chips_finance
- Discord: https://discord.gg/chips-finance

**DIA**
- Overview: Trustless, open-source oracle network offering transparent, customizable data feeds (prices, RWAs, randomness) to any chain including Kadena
- Key Features:
  • Verifiable sourcing and delivery; modular rollup-based design
  • Cross-chain compatibility for DeFi, RWAs, NFTs
  • Granular data from CEXs and DEXs with transparent aggregation
  • APIs and smart contract integrations
  • Open-source and community-driven
- Value Proposition: Provides robust, transparent external data essential for secure DeFi and tokenized applications on Kadena
- Website: https://www.diadata.org/
- Ecosystem Page: https://www.kadena.io/ecosystem/dia
- Kadena Price Feed: https://www.diadata.org/app/price/asset/Kadena/0x0000000000000000000000000000000000000000/
- X (Twitter): https://x.com/DIAdata_org
- GitHub: https://github.com/diadata-org/diadata
- Docs: https://www.diadata.org/docs/home

---

### Real-World Use Cases & DePIN

**DNA (Database of Native Assets)**
- Overview: Helps brands fight counterfeiting by minting branded NFTs to prove product provenance and authenticity on Kadena
- Key Features:
  • Anti-counterfeiting via tokenized product identities (NFTs)
  • End-to-end provenance tracking across the supply chain
  • Direct brand-to-customer trust and engagement
  • Tokenized physical products (digital twins)
  • Built on Kadena for scalability and low fees
  • Marmalade NFT standard
  • User-friendly for non-crypto brands
- Value Proposition: Reduces counterfeit risk in luxury and other markets while enabling authenticated resale and loyalty mechanics tied to NFT ownership
- Team:
  • Abraham Milano - Co-Founder & CTO
  • Adam Joannou - Co-Founder & CEO
  • Douglas Jakobi - Co-Founder & COO
- Ecosystem Page: https://www.kadena.io/ecosystem/dna
- X (Twitter): https://x.com/thednatech
- Kadena Perspectives: https://medium.com/kadena-io/spotlight-on-dna-3f9d89446dc2

**Crankk**
- Overview: Global DePIN of LoRaWAN gateways on Kadena. Gateway operators earn CRKK via Proof-of-Network-Participation. Crankk OS enables multimining across 20+ DePIN projects
- Key Features:
  • LoRaWAN IoT network with long-range, low-power connectivity
  • Proof-of-Network-Participation rewards based on real coverage
  • Crankk OS (free, open-source) with dashboard and lifetime OTA updates
  • No hotspot maker dependency; supports DIY and repurposed hardware
  • No denylist; gateway ranking for emissions
  • Automatic, real-time reward distribution
  • Meshtastic integration with CRKK rewards
  • All-in-one mobile app for gateways, wallet, live sensor data
  • Built on Kadena for low fees and scalability
  • Community governance based on participation
- Tokenomics: 80% of CRKK emission allocated to operators
- Team: Community-owned; core contributors selected by participation
- Website: https://www.crankk.io/
- Ecosystem Page: https://www.kadena.io/ecosystem/crankk
- X (Twitter): https://x.com/crankk_io
- Telegram: http://t.me/crankkofficial
- Discord: http://discord.gg/crankk
- DePIN Hub: https://depinhub.io/projects/crankk

**Cyberfly.io**
- Overview: Open-source decentralized IoT platform on Kadena with device onboarding, automation, real-time data, and monetization
- Key Features:
  • Decentralized IoT orchestration on Kadena
  • Customizable dashboards and built-in wallet (CFLY, KDA)
  • Easy onboarding for Raspberry Pi and ESP32
  • Rules/automation and orchestration
  • Optimized MicroPython firmware for ESP32
  • Hybrid storage: Redis + OrbitDB/IPFS
  • Real-time streaming and historical storage
  • End-to-end encryption and signed firmware
  • REST & WebSocket APIs; SDKs (MicroPython, Arduino C; Rust planned)
  • Incentivized node network and integrations marketplace
- Token: CFLY
- Tokenomics: Utility token with burn + treasury; portion of each fee burned; first device registration free
- Roadmap:
  • Q3 2025: Testnet enhancements (SDKs, dashboards, reliability)
  • Q4 2025: Mainnet beta (CFLY rollout, device registration, burn/treasury)
  • 2026: Marketplace, partner devices, community governance inputs
- Website: https://cyberfly.io/
- Ecosystem Page: https://www.kadena.io/ecosystem/cyberfly-io
- X (Twitter): https://x.com/cyberfly_io
- GitHub: https://github.com/cyberfly-io
- Medium: https://cyberfly-io.medium.com/
- YouTube: https://www.youtube.com/channel/UCXrov74p74hkwukbg8uSgLg

**UNITT**
- Overview: Decentralized, privacy-preserving messaging platform that tokenizes interactions so messages, clicks, and views can be monetized
- Key Features:
  • Decentralized instant messaging with Web3 privacy
  • Tokenized interactions and pay-per-view content
  • User data and identity ownership
  • Built on Kadena for scalable, low-fee operations
  • Familiar Web2-like UI to reduce friction
- Value Proposition: Provides creators and communities with integrated monetization while preserving privacy and ownership, unlike centralized Web2 messengers
- Team:
  • Jussi Mäkela - COO
  • Mikko Ville-Valiento - CTO
- Website: https://www.unitt.io/
- Ecosystem Page: https://www.kadena.io/ecosystem/unitt
- X (Twitter): https://x.com/UNITT_io
- Kadena Perspectives: https://www.kadena.io/perspectives/a-new-way-to-connect-building-a-tokenized-messaging-platform-with-unitt

---

### Developer Tools

**Eucalyptus Labs**
- Overview: Builds UX and infrastructure to connect everyday users with blockchain, supported by a Kadena grant
- Key Features:
  • User-centric product development
  • Kadena grantee with active ecosystem contributions
  • Products: Koala Wallet, Kadena Keys, KadenaDartSdk
  • Bridging UX and infra for practical blockchain adoption
- Value Proposition: Reduces complexity through polished UX and essential tooling that accelerates adoption
- Website: https://www.eucalyptuslabs.com/
- Ecosystem Page: https://www.kadena.io/ecosystem/eucalyptus-labs
- X (Twitter): https://x.com/euclabs
- LinkedIn: https://www.linkedin.com/company/eucalyptus-labs/
- GitHub: https://github.com/Eucalyptus-Labs
- Kadena Perspectives: https://www.kadena.io/perspectives/spotlight-on-eucalyptus-labs

**Hack-a-Chain**
- Overview: Software firm building custom blockchain solutions and infra for Kadena, including a fast GraphQL indexer
- Key Features:
  • Custom dApps and financial services
  • Kadena-focused infrastructure engineering
  • Developer-friendly GraphQL indexer for Kadena data
  • 2+ years of Kadena ecosystem experience
- Value Proposition: Enables teams to ship on Kadena faster with specialized development and robust data access tooling
- Website: https://www.hackachain.io/
- Ecosystem Page: https://www.kadena.io/ecosystem/hack-a-chain
- X (Twitter): https://x.com/hackachain
- GitHub: https://github.com/hack-a-chain-software
- LinkedIn: https://br.linkedin.com/company/hackachain

---

### Key Standards & Protocols

**KIP-0007 (Poly-Fungible Token Standard)**
- Overview: Similar to ERC-1155; supports both fungible and non-fungible tokens in a single contract
- Purpose: Enables efficient batch operations and hybrid token models
- Official Spec: Available at docs.kadena.io

**KIP-0013 (Marmalade v2 NFT Standard)**
- Overview: Official Kadena NFT framework with policy-based controls
- Key Features: Royalty enforcement, mint controls, flexible metadata, gas-free capabilities
- Documentation: https://docs.kadena.io/nft/marmalade-v2

**Gas Stations**
- Overview: Native Kadena feature allowing dApps to sponsor transaction fees for users
- Benefit: Enables truly gas-free user experiences across the ecosystem
- Used By: KDSwap, Mercatus, Swarms.finance, Hypercent, and many others
""" 