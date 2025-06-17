# Multiverse Finance

Event-Conditional Universal Basic Income Platform

## Project Structure

This is a monorepo using Turborepo with the following structure:

- `apps/frontend` - Next.js frontend application
- `apps/contracts` - Hardhat smart contracts
- `packages/wagmi-db` - RainbowKit/Wagmi authentication and database integration
- `packages/sdk` - TypeScript SDK for contract and backend interaction
- `packages/ui` - Shared UI components with shadcn/ui

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development servers:
```bash
npm run dev
```

3. Build all packages:
```bash
npm run build
```

## Development Commands

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run test` - Run tests
- `npm run clean` - Clean build artifacts

## Progress

### ✅ Project Setup Complete
- ✅ Monorepo with Turborepo  
- ✅ Next.js frontend app  
- ✅ Hardhat contracts project  
- ✅ RainbowKit/Wagmi integration  
- ✅ TypeScript SDK  
- ✅ Shared UI library with shadcn/ui

### ✅ Smart Contracts  
- ✅ **ConditionalToken (ERC-1155)** - Core multiverse finance contract
  - Implements verse creation and partitioning
  - Split/combine ownership mechanics (parent ↔ children)
  - Event resolution and verse evaporation
  - **Deployed locally** with mint/burn functionality tested
  - **Fixed**: Added VerseEvaporated events for off-chain indexing
  - **Note**: Partition validation and oracle integration planned for later tasks

- ✅ **MultiverseAMM** - Verse-scoped Automated Market Maker
  - Constant product AMM (x * y = k) with 0.3% fee
  - Verse-isolated liquidity pools prevent cross-verse contamination
  - Add/remove liquidity with LP share tokens
  - Swap functionality within verse boundaries
  - **Deployed locally** with pool creation and basic operations tested
  - Automatic pool evaporation when verses resolve
  - Integrates with ConditionalToken for verse validation

- ✅ **UBIManager** - Event-Conditional Universal Basic Income System
  - Create UBI programs tied to specific event outcomes
  - Mint conditional tokens that only pay out if events occur
  - Batch processing for efficient distribution
  - Budget tracking and claim prevention
  - **Deployed locally** with event-conditional UBI token minting tested
  - Access control for authorized minters and program management
  - Integration with ConditionalToken for verse validation

- ✅ **OracleManager** - Event Resolution and Verse Management System
  - Register events with authorized oracles for resolution
  - Secure event resolution with access control and double-resolution prevention
  - Integration with ConditionalToken for automatic verse resolution
  - Multi-oracle support with independent event assignment
  - **Deployed locally** with event resolution functionality tested
  - Event status tracking and outcome verification
  - Security features prevent unauthorized resolution

### Current Status
**Phase: Smart Contract Development - COMPLETE ✅**

The smart contract layer implements the complete [Multiverse Finance](https://www.paradigm.xyz/2025/05/multiverse-finance) system:

**Core Mechanics** (ConditionalToken):
- **Verse Management**: Create parallel universes for different event outcomes  
- **Ownership Splitting**: Push ownership from parent verse to child verses  
- **Ownership Combining**: Pull ownership from child verses back to parent  
- **Event Resolution**: Resolve outcomes and evaporate losing verses

**Financial Layer** (MultiverseAMM, UBIManager):
- **Verse-Scoped Trading**: AMM with isolated liquidity pools per verse
- **Event-Conditional UBI**: Government/organization UBI tied to future events
- **Risk-Free Composability**: Tokens in same verse can be used as collateral

**Oracle Integration** (OracleManager):
- **Secure Event Resolution**: Authorized oracles resolve real-world events
- **Multi-Oracle Support**: Different oracles handle different event types
- **Security Features**: Prevent unauthorized resolution and double resolution

**Next Phase**: SDK Development and Frontend Integration

Test the contracts:
```bash
cd apps/contracts
npm test                              # Run unit tests (42 passing)
npx hardhat run scripts/deploy.ts     # Deploy ConditionalToken with example
npx hardhat run scripts/deploy-amm.ts # Deploy AMM + ConditionalToken
npx hardhat run scripts/deploy-ubi.ts # Deploy UBI + ConditionalToken
npx hardhat run scripts/deploy-oracle.ts # Deploy Oracle + ConditionalToken
npx hardhat run scripts/test-amm.ts   # Test AMM functionality
npx hardhat run scripts/test-ubi.ts   # Test Event-Conditional UBI system
npx hardhat run scripts/test-oracle.ts # Test Event Resolution system
npx hardhat run scripts/test-interactions.ts  # Interactive demo
``` 