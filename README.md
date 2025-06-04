# Kadena Agents

A comprehensive suite of tools and applications for interacting with the Kadena blockchain ecosystem. This repository provides a collection of integrated components for trading, chat functionality, API interactions, and AI-powered services on the Kadena blockchain.

## Project Structure

This repository contains several specialized components:

- `kadena-trader/`: Advanced trading services with automated strategies and market analysis
- `kadena-chat-app/`: React-based chat application with wallet integration
- `kadena-api/`: Core API services for Kadena blockchain interactions including NFTs, swaps, and transfers
- `kadena-ai/`: AI-powered tools for blockchain analysis and intelligent interactions
- `evm-agents/`: Agents for interacting with EVM (Ethereum Virtual Machine) compatibility features

## Prerequisites

- Node.js (v16 or higher)
- Python 3.9+ (for AI and trading components)
- npm or yarn
- Kadena account and credentials
- API keys for relevant services

## Installation

Each component has its own dependencies and setup requirements. Follow these steps for a complete installation:

1. Clone the repository:

```bash
git clone https://github.com/Xade/kadena-agents.git
cd kadena-agents
```

2. Install dependencies for specific components:

```bash
# For the API service
cd kadena-api
npm install

# For the chat application
cd ../kadena-chat-app
npm install

# For the AI component
cd ../kadena-ai
pip install -r requirements.txt

# For the trading component
cd ../kadena-trader
pip install -r requirements.txt
npm install

# For EVM agents
cd ../evm-agents
pip install -r requirements.txt
npm install
```

## Project Components

### Kadena Trader

The trading component provides automated trading capabilities on the Kadena blockchain with a Python/JavaScript hybrid architecture. Features include:

- Market analysis and data processing
- Automated trading strategies with customizable parameters
- Portfolio management and performance tracking
- API-based trade execution
- Wallet creation and management tools

### Kadena Chat App

A React-based decentralized chat application built on Kadena that enables:

- Secure messaging with blockchain integration
- Magic.link authentication
- Wallet integration for token transfers
- TypeScript-based architecture for type safety
- Responsive design with custom styling

### Kadena API

A Node.js-based set of API services that provide:

- NFT management endpoints (routes/nft.js)
- Token swap functionality (routes/swap.js)
- Token transfer services (routes/transfer.js)
- Health monitoring endpoints (routes/health.js)
- Configuration-based token management

### Kadena AI

AI-powered Python tools that offer:

- Smart contract analysis and interaction
- Agent-based automation for blockchain tasks
- API integration for real-time data processing
- Jupyter notebook playground for experimentation
- Configurable AI parameters for different use cases

### EVM Agents

Tools for interacting with EVM (Ethereum Virtual Machine) compatibility features:

- Transaction handling and monitoring
- Smart contract deployment and interaction
- API integration for EVM-compatible chains
- Baseline implementations for common operations

## Development

Each component can be developed and tested independently. Navigate to the respective directory and follow the component-specific instructions in their README files.

### Configuration

Most components require configuration files:

- `kadena-api/config.js` - API configuration settings
- `kadena-api/tokens.yml` - Token definitions for the API
- `kadena-chat-app/.env` - Environment variables for the chat application (create from .env.example)
- `kadena-ai/config.py` - Configuration for AI services

### Running the Components

```bash
# Start the API server
cd kadena-api
node server.js

# Start the chat application in development mode
cd kadena-chat-app
npm start

# Run AI services
cd kadena-ai
python agent.py

# Execute trading strategies
cd kadena-trader
python api.py
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Integration Between Components

The components in this repository are designed to work together:

- **kadena-api** provides the backend services that the chat app and trading components consume
- **kadena-ai** can analyze data from the trader component to suggest optimized strategies
- **kadena-chat-app** uses the API services for blockchain interactions
- **evm-agents** extend functionality to EVM-compatible operations

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Security

Please report any security issues responsibly by contacting the repository maintainers. Do not disclose security issues publicly until they have been addressed.

## Roadmap

- Enhanced integration between AI and trading components
- Expanded EVM compatibility features
- Additional wallet integration options
- Improved documentation and examples
- Performance optimizations for high-volume trading
